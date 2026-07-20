import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ANOMALY_FIELDS,
  artifactTypeProgress,
  missingArtifactTypes,
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
  worldToLatLng,
} from "../lib/mapCoords";
import { useLocale } from "../i18n/LocaleContext";
import { anomalyTypeLabel, locName } from "../i18n/localize";

function markerHtml(worth: boolean, approx: boolean): string {
  const tone = worth ? "worth" : "done";
  const label = worth ? "◆" : "✓";
  return `<span class="mh-marker mh-marker-${tone}${approx ? " mh-marker-approx" : ""}">${label}</span>`;
}

export function MiracleMapPage() {
  const { t, locale } = useLocale();
  const { collectedArtifactIds } = useProgress();
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

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const missingTypes = useMemo(
    () => missingArtifactTypes(collectedArtifactIds),
    [collectedArtifactIds],
  );
  const typeProgress = useMemo(
    () => artifactTypeProgress(collectedArtifactIds),
    [collectedArtifactIds],
  );

  const filtered = useMemo(() => {
    return ANOMALY_FIELDS.filter((f) => {
      if (anomalyType !== "all" && f.anomalyType !== anomalyType) return false;
      const worth = missingTypes.has(f.anomalyType);
      if (worthOnly && !worth) return false;
      return true;
    });
  }, [anomalyType, worthOnly, missingTypes]);

  const selected: AnomalyField | null = useMemo(() => {
    if (!selectedId) return null;
    return ANOMALY_FIELDS.find((f) => f.id === selectedId) ?? null;
  }, [selectedId]);

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
      attributionControl: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(TILE_URL, {
      tileSize: 512,
      maxZoom: 7,
      maxNativeZoom: 7,
      bounds: MAP_BOUNDS,
      noWrap: true,
      attribution: TILE_ATTR,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markersRef.current.clear();

    for (const f of filtered) {
      const worth = missingTypes.has(f.anomalyType);
      const icon = L.divIcon({
        className: "mh-marker-wrap",
        html: markerHtml(worth, Boolean(f.coordApprox)),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker(worldToLatLng(f.worldX, f.worldY), { icon });
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
  }, [filtered, missingTypes, setParams]);

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

  return (
    <div className="page map-page">
      <section className="guarantee-card" aria-labelledby="miracle-map-title">
        <h2 id="miracle-map-title">{t("miracleGuaranteeTitle")}</h2>
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
      </section>

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
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
              {anomalyTypeLabel(selected.anomalyType, locale)} ·{" "}
              {selected.region}
              {selected.coordApprox ? " · орієнтовні координати" : ""}
            </p>
            <p className="notes">
              {selectedProg.got}/{selectedProg.total} артефактів цього типу
              зібрано
            </p>
            {selected.notes && <p className="notes">{selected.notes}</p>}
          </aside>
        )}
      </div>

      <div className="map-filters-card">
        <div className="filters map-filters">
          <label>
            {t("anomalyType")}
            <select
              value={anomalyType}
              onChange={(e) => {
                const v = e.target.value as typeof anomalyType;
                setAnomalyType(v);
                setParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (v === "all") next.delete("type");
                  else next.set("type", v);
                  return next;
                });
              }}
            >
              <option value="all">{t("statusAll")}</option>
              {ANOMALY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {anomalyTypeLabel(type, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={worthOnly}
              onChange={(e) => setWorthOnly(e.target.checked)}
            />
            {t("worthOnly")}
          </label>
        </div>
      </div>

      <p className="hint map-legend">
        <span className="mh-marker mh-marker-worth legend-swatch">◆</span>{" "}
        {t("legendWorth")}{" "}
        <span className="mh-marker mh-marker-done legend-swatch">✓</span>{" "}
        {t("legendTypeDone")} · {t("legendMiracleCoords")} · {t("legendTiles")}
      </p>
    </div>
  );
}
