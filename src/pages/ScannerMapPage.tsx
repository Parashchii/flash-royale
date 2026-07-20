import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SCANNERS, SCANNER_REGIONS } from "../data/catalog";
import type { Scanner } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import {
  MAP_BOUNDS,
  MAP_CENTER,
  TILE_ATTR,
  TILE_URL,
  worldToLatLng,
} from "../lib/mapCoords";
import { useLocale } from "../i18n/LocaleContext";

type StatusFilter = "all" | "missing" | "collected";

function markerHtml(got: boolean): string {
  const tone = got ? "collected" : "missing";
  const label = got ? "✓" : "◆";
  return `<span class="sc-marker sc-marker-${tone}">${label}</span>`;
}

export function ScannerMapPage() {
  const { t } = useLocale();
  const { collectedScannerIds, toggleScanner } = useProgress();
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
    return SCANNERS.filter((s) => {
      if (region !== "all" && s.region !== region) return false;
      const got = collectedScannerIds.has(s.id);
      if (status === "missing" && got) return false;
      if (status === "collected" && !got) return false;
      return true;
    });
  }, [region, status, collectedScannerIds]);

  const selected: Scanner | null = useMemo(() => {
    if (!selectedId) return null;
    return SCANNERS.find((s) => s.id === selectedId) ?? null;
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

    for (const s of filtered) {
      const got = collectedScannerIds.has(s.id);
      const icon = L.divIcon({
        className: "sc-marker-wrap",
        html: markerHtml(got),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker(worldToLatLng(s.worldX, s.worldY), { icon });
      marker.on("click", () => {
        setSelectedId(s.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", s.id);
          return next;
        });
      });
      marker.addTo(group);
      markersRef.current.set(s.id, marker);
    }
  }, [filtered, collectedScannerIds, setParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const s = SCANNERS.find((d) => d.id === selectedId);
    if (!s) return;
    const ll = worldToLatLng(s.worldX, s.worldY);
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
    ? collectedScannerIds.has(selected.id)
    : false;

  return (
    <div className="page map-page">
      <section className="guarantee-card" aria-labelledby="scanner-map-title">
        <h2 id="scanner-map-title">{t("scannerGuaranteeTitle")}</h2>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("scannerGuarantee1Before")}{" "}
              <strong>{t("scannerGuarantee1Strong")}</strong>{" "}
              {t("scannerGuarantee1After")}
            </span>
          </li>
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>{t("scannerGuarantee2")}</span>
          </li>
        </ul>
      </section>

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
          role="application"
          aria-label={t("mapAriaScanners")}
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
              {selected.nameUk}
              <span className="sheet-title-en">{selected.nameEn}</span>
            </h2>
            <p className="flash-meta">
              {selected.region} · {selected.poiUk}
            </p>
            <p className="notes">
              Артефакт: {selected.artifactNameUk} ({selected.artifactNameEn})
            </p>
            {selected.conditionUk && (
              <p className="notes">
                <strong>Умова:</strong> {selected.conditionUk}
              </p>
            )}
            <p className="notes">{selected.accessUk}</p>
            {selected.notes && <p className="notes">{selected.notes}</p>}
            <div className="choice-actions">
              <button
                type="button"
                className="btn"
                onClick={() => toggleScanner(selected.id)}
              >
                {selectedGot ? "Зняти позначку" : "Позначити зібраним"}
              </button>
              <Link
                className="btn btn-ghost"
                to={`/scanning-complete/list?q=${encodeURIComponent(selected.region)}`}
              >
                {t("inList")}
              </Link>
            </div>
          </aside>
        )}
      </div>

      <div className="map-filters-card">
        <div className="filters map-filters">
          <label>
            {t("region")}
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="all">{t("statusAll")}</option>
              {SCANNER_REGIONS.map((r) => (
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

      <p className="hint map-legend">
        <span className="sc-marker sc-marker-missing legend-swatch">◆</span>{" "}
        {t("legendMissing")}{" "}
        <span className="sc-marker sc-marker-collected legend-swatch">✓</span>{" "}
        {t("legendCollected")} · {t("legendScannerSources")} · {t("legendTiles")}
      </p>
    </div>
  );
}
