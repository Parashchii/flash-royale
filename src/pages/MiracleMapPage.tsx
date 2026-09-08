import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ANOMALY_FIELDS,
  ANOMALY_REGIONS,
  artifactTypeProgress,
  missingArtifactTypes,
  trackedArtifactIds,
} from "../data/catalog";
import {
  ANOMALY_TYPES,
  type AnomalyField,
  type AnomalyType,
} from "../data/types";
import { useProgress } from "../hooks/useProgress";
import {
  MAP_BOUNDS,
  MAP_CENTER,
  TILE_ATTR,
  TILE_URL,
  latLngToWorld,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { computeFarmRoute } from "../lib/routeClient";
import { loadWalkGrid, WALKABILITY_OVERLAY_URL } from "../lib/walkability";
import { formatRouteTime, routeDurationSec, type RoutePlan } from "../lib/pathfinding";
import { styleRouteLine } from "../lib/routeLine";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName, locRegion } from "../i18n/localize";
import {
  ANOMALY_MARKER_SIZE,
  AnomalyTypeIcon,
  anomalyTypeMarkerHtml,
} from "../components/AnomalyTypeIcon";
import { AnomalyTypeFilter } from "../components/FilterCard";
import { GuaranteeFab } from "../components/GuaranteeFab";
import { MapDrawerBlock, MapLegend } from "../components/MapLegend";
import { MapSidePanel } from "../components/MapSidePanel";
import { MapDocsDrawer } from "../components/MapDocsDrawer";
import { MiracleListPage } from "./MiracleListPage";
import { MiracleOverviewPage } from "./MiracleOverviewPage";

export function MiracleMapPage() {
  const { t, locale } = useLocale();
  const {
    collectedArtifactIds,
    foundArtifactIds,
    inaccessibleRegions,
    toggleInaccessibleRegion,
  } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");
  const typeParam = params.get("type");

  const [anomalyType, setAnomalyType] = useState<"all" | AnomalyType>(() =>
    typeParam && ANOMALY_TYPES.includes(typeParam as AnomalyType)
      ? (typeParam as AnomalyType)
      : "all",
  );
  const [worthOnly, setWorthOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [routeMode, setRouteMode] = useState<5 | "all" | null>(null);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [computing, setComputing] = useState(false);
  const [showMask, setShowMask] = useState(false);
  const [routeChoice, setRouteChoice] = useState<5 | "all">(5);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const maskLayerRef = useRef<L.ImageOverlay | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const trackedIds = useMemo(
    () => trackedArtifactIds(collectedArtifactIds, foundArtifactIds),
    [collectedArtifactIds, foundArtifactIds],
  );
  const missingTypes = useMemo(
    () => missingArtifactTypes(trackedIds),
    [trackedIds],
  );
  const typeProgress = useMemo(
    () => artifactTypeProgress(trackedIds),
    [trackedIds],
  );

  const routeIndexById = useMemo(() => {
    const map = new Map<string, number>();
    plan?.stops.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [plan]);

  const filtered = useMemo(() => {
    return ANOMALY_FIELDS.filter((f) => {
      if (anomalyType !== "all" && f.anomalyType !== anomalyType) return false;
      const accessible = !inaccessibleRegions.has(f.region);
      const worth = accessible && missingTypes.has(f.anomalyType);
      if (worthOnly && !worth) return false;
      return true;
    });
  }, [anomalyType, worthOnly, missingTypes, inaccessibleRegions]);

  const routeGoals = useMemo(
    () =>
      ANOMALY_FIELDS.filter((f) => {
        if (inaccessibleRegions.has(f.region)) return false;
        if (!missingTypes.has(f.anomalyType)) return false;
        if (anomalyType !== "all" && f.anomalyType !== anomalyType) return false;
        return true;
      }).map((f) => ({ id: f.id, x: f.worldX, y: f.worldY })),
    [inaccessibleRegions, missingTypes, anomalyType],
  );
  const routeGoalIds = routeGoals.map((g) => g.id).join(",");
  const routeGoalsRef = useRef(routeGoals);
  routeGoalsRef.current = routeGoals;

  const selected: AnomalyField | null = useMemo(() => {
    if (!selectedId) return null;
    return ANOMALY_FIELDS.find((f) => f.id === selectedId) ?? null;
  }, [selectedId]);

  useEffect(() => {
    void loadWalkGrid();
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      crs: L.CRS.Simple,
      center: MAP_CENTER,
      zoom: 1,
      minZoom: 0,
      maxZoom: 7,
      maxBounds: MAP_BOUNDS.pad(0.05),
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, {
      tileSize: 512,
      maxZoom: 7,
      maxNativeZoom: 7,
      bounds: MAP_BOUNDS,
      noWrap: true,
      attribution: TILE_ATTR,
    }).addTo(map);

    addRegionHoverLayer(map);
    const group = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;
    routeLayerRef.current = routeGroup;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      routeLayerRef.current = null;
      startMarkerRef.current = null;
      maskLayerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      setStart(latLngToWorld(e.latlng.lat, e.latlng.lng));
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markersRef.current.clear();

    for (const f of filtered) {
      const accessible = !inaccessibleRegions.has(f.region);
      const worth = accessible && missingTypes.has(f.anomalyType);
      const routeIndex = routeIndexById.get(f.id);
      const icon = L.divIcon({
        className: "mh-marker-wrap",
        html: anomalyTypeMarkerHtml(f.anomalyType, {
          done: !worth,
          approx: Boolean(f.coordApprox),
          routeIndex,
        }),
        iconSize: [ANOMALY_MARKER_SIZE, ANOMALY_MARKER_SIZE],
        iconAnchor: [ANOMALY_MARKER_SIZE / 2, ANOMALY_MARKER_SIZE / 2],
      });
      const marker = L.marker(worldToLatLng(f.worldX, f.worldY), {
        icon,
        zIndexOffset: routeIndex != null ? 400 + routeIndex : 0,
      });
      marker.on("click", () => {
        setSelectedId(f.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", f.id);
          return next;
        });
      });
      marker.addTo(group);
      markersRef.current.set(f.id, marker);
    }
  }, [filtered, missingTypes, inaccessibleRegions, routeIndexById, setParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (!start) return;

    const icon = L.divIcon({
      className: "mh-marker-wrap",
      html: `<span class="mh-start-marker" title="${t("routeStart")}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker(worldToLatLng(start.x, start.y), {
      icon,
      zIndexOffset: 900,
      interactive: false,
    });
    marker.addTo(map);
    startMarkerRef.current = marker;
  }, [start, t]);

  useEffect(() => {
    const map = mapRef.current;
    const group = routeLayerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (!plan || plan.polyline.length < 2) return;
    const latlngs = styleRouteLine(plan.polyline).map((p) => worldToLatLng(p.x, p.y));
    L.polyline(latlngs, {
      color: "#e6c36a",
      weight: 2,
      opacity: 0.88,
      dashArray: "7 9",
      lineJoin: "round",
      lineCap: "round",
      interactive: false,
    }).addTo(group);
  }, [plan]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (maskLayerRef.current) {
      map.removeLayer(maskLayerRef.current);
      maskLayerRef.current = null;
    }
    if (!showMask) return;
    const overlay = L.imageOverlay(WALKABILITY_OVERLAY_URL, MAP_BOUNDS, {
      opacity: 0.72,
      className: "mh-walk-overlay",
      interactive: false,
    });
    overlay.addTo(map);
    maskLayerRef.current = overlay;
  }, [showMask]);

  useEffect(() => {
    if (!start || routeMode == null) {
      setPlan(null);
      setComputing(false);
      return;
    }
    if (routeGoalsRef.current.length === 0) {
      setPlan({ stops: [], unreachable: [], polyline: [] });
      setComputing(false);
      return;
    }
    let cancelled = false;
    setComputing(true);
    const limit = routeMode === "all" ? null : 5;
    void computeFarmRoute(start, routeGoalsRef.current, limit)
      .then((next) => {
        if (cancelled) return;
        setPlan(next);
        setComputing(false);
      })
      .catch(() => {
        if (cancelled) return;
        setComputing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [start, routeMode, routeGoalIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const f = ANOMALY_FIELDS.find((d) => d.id === selectedId);
    if (!f) return;
    const ll = worldToLatLng(f.worldX, f.worldY);
    map.setView(ll, Math.max(map.getZoom(), 4), { animate: true });
  }, [selectedId, focusId]);

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  useEffect(() => {
    if (typeParam && ANOMALY_TYPES.includes(typeParam as AnomalyType)) {
      setAnomalyType(typeParam as AnomalyType);
    }
  }, [typeParam]);

  const closeSheet = () => {
    setSelectedId(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  };

  const selectedProg = selected
    ? typeProgress[selected.anomalyType]
    : null;

  const requestRoute = (mode: 5 | "all") => {
    if (!start) return;
    setRouteMode(mode);
  };

  const clearRoute = () => {
    setRouteMode(null);
    setPlan(null);
  };

  const focusStop = (id: string) => {
    setSelectedId(id);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("id", id);
      return next;
    });
  };

  return (
    <div className="page map-page">
      <div className="map-tools">
        <MapSidePanel title={t("routeBuildTitle")}>
          <div className="map-filters-card">
            <div className="mh-drawer-block">
              <p className="mh-drawer-block-title">
                1 • {t("routeSetStartHint")}
              </p>
            </div>

            <MapDrawerBlock title={`2 • ${t("routeSettings")}`} defaultOpen>
              <AnomalyTypeFilter
                embedded
                value={anomalyType}
                onChange={(v) => {
                  setAnomalyType(v);
                  setParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (v === "all") next.delete("type");
                    else next.set("type", v);
                    return next;
                  });
                }}
              />
              <div className="mh-drawer-checks">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={worthOnly}
                    onChange={(e) => setWorthOnly(e.currentTarget.checked)}
                  />
                  {t("worthOnly")}
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={showMask}
                    onChange={(e) => setShowMask(e.currentTarget.checked)}
                  />
                  {t("routeShowMask")}
                </label>
              </div>
            </MapDrawerBlock>

            <MapDrawerBlock title={`3 • ${t("routeAccessibleRegions")}`}>
              <div className="mh-region-grid">
                {ANOMALY_REGIONS.map((region) => (
                  <label key={region} className="check-label mh-region-check">
                    <input
                      type="checkbox"
                      checked={!inaccessibleRegions.has(region)}
                      onChange={() => toggleInaccessibleRegion(region)}
                    />
                    {locRegion({ region }, locale)}
                  </label>
                ))}
              </div>
            </MapDrawerBlock>

            <MapDrawerBlock
              title={`4 • ${t("routeFarm")}`}
              defaultOpen
              className="mh-route-panel"
            >
              <div className="mh-route-radios">
                <label className="check-label mh-route-radio">
                  <input
                    type="radio"
                    name="mh-route-choice"
                    checked={routeChoice === "all"}
                    onChange={() => setRouteChoice("all")}
                  />
                  <span className="mh-route-radio-copy">
                    <span>{t("routeAll")}</span>
                    <span className="mh-route-radio-hint">{t("routeAllHint")}</span>
                  </span>
                </label>
                <label className="check-label mh-route-radio">
                  <input
                    type="radio"
                    name="mh-route-choice"
                    checked={routeChoice === 5}
                    onChange={() => setRouteChoice(5)}
                  />
                  {t("routeNext5")}
                </label>
              </div>
              <button
                type="button"
                className="btn mh-route-build"
                disabled={!start || computing}
                onClick={() => requestRoute(routeChoice)}
              >
                {t("routeBuildTitle")}
              </button>
              {computing && <p className="mh-route-status">{t("routeComputing")}</p>}
              {!computing && start && routeMode != null && plan && plan.stops.length === 0 && (
                <p className="mh-route-status">{t("routeEmpty")}</p>
              )}
            </MapDrawerBlock>

            <button
              type="button"
              className="mh-route-clear"
              disabled={!plan && routeMode == null}
              onClick={clearRoute}
            >
              {t("routeClear")}
            </button>

            {plan && plan.stops.length > 0 && (
              <ol className="mh-route-stops">
                <li className="mh-route-stops-head">
                  <h3>{t("routeStops")}</h3>
                  <span className="mh-route-time">
                    {t("routeTimeEst")} {formatRouteTime(routeDurationSec(plan.stops), locale)}
                  </span>
                </li>
                {plan.stops.map((stop, i) => {
                  const field = ANOMALY_FIELDS.find((f) => f.id === stop.id);
                  if (!field) return null;
                  return (
                    <li key={stop.id}>
                      <button
                        type="button"
                        className="mh-route-stop"
                        onClick={() => focusStop(stop.id)}
                      >
                        <span className="mh-route-stop-n">{i + 1}</span>
                        <AnomalyTypeIcon type={field.anomalyType} size={16} />
                        <span className="mh-route-stop-body">
                          <strong>{locName(field, locale)}</strong>
                          <span>
                            {anomalyTypeLabel(field.anomalyType, locale)} ·{" "}
                            {locRegion(field, locale)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {plan && plan.unreachable.length > 0 && (
              <ul className="mh-route-unreachable">
                {plan.unreachable.map((id) => {
                  const field = ANOMALY_FIELDS.find((f) => f.id === id);
                  if (!field) return null;
                  return (
                    <li key={id}>
                      {t("routeUnreachable")}: {locName(field, locale)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <MapLegend>
            <ul className="hint map-legend mh-map-legend">
            {ANOMALY_TYPES.map((type) => (
              <li key={type} className="mh-legend-type">
                <span
                  className={`mh-marker mh-marker-type mh-marker-${type} mh-marker-worth legend-swatch`}
                >
                  <AnomalyTypeIcon type={type} size={16} color="#fff8ef" />
                </span>
                {anomalyTypeLabel(type, locale)}
              </li>
            ))}
            <li className="mh-legend-type">
              <span className="mh-marker mh-marker-done legend-swatch">
                <AnomalyTypeIcon type="thermal" size={16} color="#e8ece8" />
              </span>
              {t("legendTypeDone")}
            </li>
            </ul>
          </MapLegend>
        </MapSidePanel>
        <GuaranteeFab title={t("miracleGuaranteeTitle")}>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("miracleGuarantee1Before")}{" "}
              <strong>{t("miracleGuarantee1Strong")}</strong>{" "}
              {t("miracleGuarantee1After")}
            </span>
          </li>
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("miracleGuarantee2Before")}{" "}
              <strong>{t("miracleGuarantee2Strong")}</strong>
              {t("miracleGuarantee2After")}
            </span>
          </li>
        </ul>
      </GuaranteeFab>
      </div>

      <MapDocsDrawer
        list={<MiracleListPage />}
        overview={<MiracleOverviewPage />}
      />

      <div className="map-stage">
        <div
          ref={mapEl}
          className={`pda-map${start ? "" : " mh-map-pick-start"}`}
          role="application"
          aria-label={t("mapAriaAnomalies")}
        />

        {selected && selectedProg && (
          <aside className="map-sheet" aria-live="polite">
            <button
              type="button"
              className="sheet-close"
              onClick={closeSheet}
              aria-label={t("close")}
            >
              ×
            </button>
            <h2 className="sheet-title">
              {locName(selected, locale)}
              <span className="sheet-title-en">
                {locale === "uk" ? selected.nameEn : selected.nameUk}
              </span>
            </h2>
            <p className="flash-meta">
              <AnomalyTypeIcon type={selected.anomalyType} size={18} />{" "}
              {anomalyTypeLabel(selected.anomalyType, locale)} ·{" "}
              {locRegion(selected, locale)}
              {selected.coordApprox ? ` · ${t("approxCoords")}` : ""}
            </p>
            <p className="notes">
              {selectedProg.got}/{selectedProg.total} {t("typeProgressAfter")}
            </p>
            {selected.notes && <p className="notes">{selected.notes}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
