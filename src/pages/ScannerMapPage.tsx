import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SCANNERS } from "../data/catalog";
import type { Scanner } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import {
  pdaMapOptions,
  pdaTileLayer,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locName, locPoi, locRegion } from "../i18n/localize";
import { GuaranteeFab } from "../components/GuaranteeFab";
import { MapDocsDrawer } from "../components/MapDocsDrawer";
import { ScannerListPage } from "./ScannerListPage";
import { ScannerOverviewPage } from "./ScannerOverviewPage";
import {
  TRACKER_MARKER_SIZE,
  scannerMarkerHtml,
} from "../components/TrackerMarkerGlyphs";

function markerHtml(got: boolean): string {
  return scannerMarkerHtml(got);
}

export function ScannerMapPage() {
  const { t, locale } = useLocale();
  const { collectedScannerIds, toggleScanner } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const [selectedId, setSelectedId] = useState<string | null>(focusId);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const filtered = SCANNERS;

  const selected: Scanner | null = useMemo(() => {
    if (!selectedId) return null;
    return SCANNERS.find((s) => s.id === selectedId) ?? null;
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

    for (const s of filtered) {
      const got = collectedScannerIds.has(s.id);
      const icon = L.divIcon({
        className: "sc-marker-wrap",
        html: markerHtml(got),
        iconSize: [TRACKER_MARKER_SIZE, TRACKER_MARKER_SIZE],
        iconAnchor: [TRACKER_MARKER_SIZE / 2, TRACKER_MARKER_SIZE / 2],
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
      <div className="map-tools">
        <GuaranteeFab title={t("scannerGuaranteeTitle")}>
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
      </GuaranteeFab>
      </div>

      <MapDocsDrawer
        list={<ScannerListPage />}
        overview={<ScannerOverviewPage />}
      />

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
              {locName(selected, locale)}
              <span className="sheet-title-en">
                {locale === "uk" ? selected.nameEn : selected.nameUk}
              </span>
            </h2>
            <p className="flash-meta">
              {locRegion(selected, locale)} · {locPoi(selected, locale)}
            </p>
            <p className="notes">
              {t("artifactLabel")}:{" "}
              {locField(
                selected.artifactNameUk,
                selected.artifactNameEn,
                locale,
              )}
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
                onClick={() => toggleScanner(selected.id)}
              >
                {selectedGot ? t("unmarkCollected") : t("markCollected")}
              </button>
              <Link
                className="btn btn-ghost"
                to={`/scanning-complete?view=list&q=${encodeURIComponent(locRegion(selected, locale))}`}
              >
                {t("inList")}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
