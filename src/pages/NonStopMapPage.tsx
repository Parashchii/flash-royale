import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NON_STOP_CANS } from "../data/catalog";
import type { NonStopCan } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import {
  MAP_BOUNDS,
  MAP_CENTER,
  TILE_ATTR,
  TILE_URL,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { useLocale } from "../i18n/LocaleContext";
import { locField, locName, locPoi, locRegion } from "../i18n/localize";
import { MapLegend } from "../components/MapLegend";
import { MapSidePanel } from "../components/MapSidePanel";
import {
  NonStopGlyph,
  TRACKER_MARKER_SIZE,
  nonStopMarkerHtml,
} from "../components/TrackerMarkerGlyphs";

function markerHtml(got: boolean): string {
  return nonStopMarkerHtml(got);
}

export function NonStopMapPage() {
  const { t, locale } = useLocale();
  const { collectedNonStopIds, toggleNonStop } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const [selectedId, setSelectedId] = useState<string | null>(focusId);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const selected: NonStopCan | null = useMemo(() => {
    if (!selectedId) return null;
    return NON_STOP_CANS.find((c) => c.id === selectedId) ?? null;
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

    for (const can of NON_STOP_CANS) {
      const got = collectedNonStopIds.has(can.id);
      const icon = L.divIcon({
        className: "ns-marker-wrap",
        html: markerHtml(got),
        iconSize: [TRACKER_MARKER_SIZE, TRACKER_MARKER_SIZE],
        iconAnchor: [TRACKER_MARKER_SIZE / 2, TRACKER_MARKER_SIZE / 2],
      });
      const marker = L.marker(worldToLatLng(can.worldX, can.worldY), { icon });
      marker.on("click", () => {
        setSelectedId(can.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", can.id);
          return next;
        });
      });
      marker.addTo(group);
      markersRef.current.set(can.id, marker);
    }
  }, [collectedNonStopIds, setParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const can = NON_STOP_CANS.find((d) => d.id === selectedId);
    if (!can) return;
    const ll = worldToLatLng(can.worldX, can.worldY);
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
    ? collectedNonStopIds.has(selected.id)
    : false;

  return (
    <div className="page map-page">
      <div className="map-tools">
        <MapSidePanel title={t("mapPanelTitle")}>
          <MapLegend>
            <ul className="hint map-legend">
              <li>
                <span className="ns-marker ns-marker-missing legend-swatch">
                  <NonStopGlyph height={16} />
                </span>
                {t("legendMissing")}
              </li>
              <li>
                <span className="ns-marker ns-marker-collected legend-swatch">
                  <NonStopGlyph height={16} />
                </span>
                {t("legendCollected")}
              </li>
            </ul>
          </MapLegend>
        </MapSidePanel>
      </div>

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
          role="application"
          aria-label={t("mapAriaNonStop")}
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
              {selected.coordApprox ? ` · ${t("approxCoords")}` : ""}
            </p>
            <p className="notes">
              {locField(selected.accessUk, selected.accessEn, locale)}
            </p>
            {selected.notes && <p className="notes">{selected.notes}</p>}
            <div className="choice-actions">
              <button
                type="button"
                className="btn"
                onClick={() => toggleNonStop(selected.id)}
              >
                {selectedGot ? t("unmarkCollected") : t("markCollected")}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
