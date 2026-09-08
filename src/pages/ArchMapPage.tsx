import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ARCH_ARTIFACTS, ARCH_REGIONS } from "../data/catalog";
import type { ArchArtifact } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import {
  pdaMapOptions,
  pdaTileLayer,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { useLocale } from "../i18n/LocaleContext";
import { locAnomaly, locName, locRegion } from "../i18n/localize";
import { GuaranteeFab } from "../components/GuaranteeFab";
import { MapLegend } from "../components/MapLegend";
import { MapSidePanel } from "../components/MapSidePanel";
import { MapDocsDrawer } from "../components/MapDocsDrawer";
import { ArchListPage } from "./ArchListPage";
import { ArchOverviewPage } from "./ArchOverviewPage";
import {
  StarGlyph,
  TRACKER_MARKER_SIZE,
  archMarkerHtml,
} from "../components/TrackerMarkerGlyphs";

type StatusFilter = "all" | "missing" | "collected";

function markerHtml(got: boolean): string {
  return archMarkerHtml(got);
}

export function ArchMapPage() {
  const { t, locale } = useLocale();
  const { collectedArchArtifactIds, toggleArchArtifact } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(focusId);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const filtered = useMemo(() => {
    return ARCH_ARTIFACTS.filter((a) => {
      if (region !== "all" && a.region !== region) return false;
      const got = collectedArchArtifactIds.has(a.id);
      if (status === "missing" && got) return false;
      if (status === "collected" && !got) return false;
      return true;
    });
  }, [region, status, collectedArchArtifactIds]);

  const selected: ArchArtifact | null = useMemo(() => {
    if (!selectedId) return null;
    return ARCH_ARTIFACTS.find((a) => a.id === selectedId) ?? null;
  }, [selectedId]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, pdaMapOptions());

    pdaTileLayer().addTo(map);

    addRegionHoverLayer(map);
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

    for (const a of filtered) {
      const got = collectedArchArtifactIds.has(a.id);
      const icon = L.divIcon({
        className: "aa-marker-wrap",
        html: markerHtml(got),
        iconSize: [TRACKER_MARKER_SIZE, TRACKER_MARKER_SIZE],
        iconAnchor: [TRACKER_MARKER_SIZE / 2, TRACKER_MARKER_SIZE / 2],
      });
      const marker = L.marker(worldToLatLng(a.worldX, a.worldY), { icon });
      marker.on("click", () => {
        setSelectedId(a.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", a.id);
          return next;
        });
      });
      marker.addTo(group);
      markersRef.current.set(a.id, marker);
    }
  }, [filtered, collectedArchArtifactIds, setParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const a = ARCH_ARTIFACTS.find((d) => d.id === selectedId);
    if (!a) return;
    const ll = worldToLatLng(a.worldX, a.worldY);
    map.setView(ll, Math.max(map.getZoom(), 4), { animate: true });
  }, [selectedId, focusId]);

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  const closeSheet = () => {
    setSelectedId(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  };

  const selectedGot = selected
    ? collectedArchArtifactIds.has(selected.id)
    : false;

  return (
    <div className="page map-page">
      <div className="map-tools">
        <MapSidePanel title={t("mapPanelTitle")}>
          <div className="map-filters-card">
            <div className="filters map-filters">
              <label>
                {t("region")}
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="all">{t("statusAll")}</option>
                  {ARCH_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("status")}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                >
                  <option value="all">{t("statusAll")}</option>
                  <option value="missing">{t("statusMissing")}</option>
                  <option value="collected">{t("statusCollected")}</option>
                </select>
              </label>
            </div>
          </div>

          <MapLegend>
            <ul className="hint map-legend">
            <li>
              <span className="aa-marker aa-marker-missing legend-swatch">
                <StarGlyph size={16} />
              </span>
              {t("legendMissing")}
            </li>
            <li>
              <span className="aa-marker aa-marker-collected legend-swatch">
                <StarGlyph size={16} />
              </span>
              {t("legendCollected")}
            </li>
            <li>{t("legendArchSources")}</li>
            </ul>
          </MapLegend>
        </MapSidePanel>
        <GuaranteeFab title={t("archGuaranteeTitle")}>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("archGuarantee1Before")}{" "}
              <strong>{t("archGuarantee1Strong")}</strong>{" "}
              {t("archGuarantee1After")}
            </span>
          </li>
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>{t("archGuarantee2")}</span>
          </li>
        </ul>
      </GuaranteeFab>
      </div>

      <MapDocsDrawer
        list={<ArchListPage />}
        overview={<ArchOverviewPage />}
      />

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
          role="application"
          aria-label={t("mapAriaArch")}
        />

        {selected && (
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
              {locRegion(selected, locale)} · {locAnomaly(selected, locale)}
            </p>
            {selected.conditionUk && (
              <p className="notes">
                <strong>{t("conditionLabel")}:</strong> {selected.conditionUk}
              </p>
            )}
            <p className="notes">{selected.accessUk}</p>
            {selected.notes && <p className="notes">{selected.notes}</p>}
            <div className="choice-actions">
              <button
                type="button"
                className="btn"
                onClick={() => toggleArchArtifact(selected.id)}
              >
                {selectedGot ? t("unmarkCollected") : t("markCollected")}
              </button>
              <Link
                className="btn btn-ghost"
                to={`/curiouser-curiouser?view=list&q=${encodeURIComponent(locName(selected, locale))}`}
              >
                {t("listTitle")}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
