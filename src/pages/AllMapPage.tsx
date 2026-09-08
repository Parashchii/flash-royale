import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ANOMALY_FIELDS,
  ARCH_ARTIFACTS,
  FLASHDRIVES,
  NON_STOP_CANS,
  SCANNERS,
  UNIQUE_BLUEPRINT_KEYS,
  missingArtifactTypes,
  trackedArtifactIds,
} from "../data/catalog";
import { ACHIEVEMENTS } from "../data/achievements";
import { useProgress } from "../hooks/useProgress";
import {
  pdaMapOptions,
  pdaTileLayer,
  worldToLatLng,
} from "../lib/mapCoords";
import { addRegionHoverLayer } from "../lib/regionOverlay";
import { useLocale } from "../i18n/LocaleContext";
import { locName } from "../i18n/localize";
import {
  ANOMALY_MARKER_SIZE,
  AnomalyTypeIcon,
  anomalyTypeMarkerHtml,
} from "../components/AnomalyTypeIcon";
import { GuaranteeFab } from "../components/GuaranteeFab";
import { MapLegend } from "../components/MapLegend";
import { MapSidePanel } from "../components/MapSidePanel";
import {
  FlashGlyph,
  NonStopGlyph,
  ScannerGlyph,
  StarGlyph,
  TRACKER_MARKER_SIZE,
  archMarkerHtml,
  flashMarkerHtml,
  nonStopMarkerHtml,
  scannerMarkerHtml,
} from "../components/TrackerMarkerGlyphs";

type LayerId =
  | "flash-royale"
  | "miracle-hoarder"
  | "scanning-complete"
  | "curiouser-curiouser"
  | "non-stop";

type UnifiedMarker = {
  key: string;
  layer: LayerId;
  worldX: number;
  worldY: number;
  titleUk: string;
  titleEn: string;
  metaUk: string;
  metaEn: string;
  detail?: string;
  done: boolean;
  mapHref: string;
  html: string;
};

function wrapClass(layer: LayerId): string {
  if (layer === "flash-royale") return "fr-marker-wrap";
  if (layer === "miracle-hoarder") return "mh-marker-wrap";
  if (layer === "scanning-complete") return "sc-marker-wrap";
  if (layer === "non-stop") return "ns-marker-wrap";
  return "aa-marker-wrap";
}

export function AllMapPage() {
  const { locale, t } = useLocale();
  const {
    collectedKeys,
    collectedArtifactIds,
    foundArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
    collectedNonStopIds,
  } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const layerIds = [
    "flash-royale",
    "miracle-hoarder",
    "scanning-complete",
    "curiouser-curiouser",
    "non-stop",
  ] as const;

  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    "flash-royale": true,
    "miracle-hoarder": true,
    "scanning-complete": true,
    "curiouser-curiouser": true,
    "non-stop": true,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(focusId);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const trackedIds = useMemo(
    () => trackedArtifactIds(collectedArtifactIds, foundArtifactIds),
    [collectedArtifactIds, foundArtifactIds],
  );
  const missingTypes = useMemo(
    () => missingArtifactTypes(trackedIds),
    [trackedIds],
  );

  const markers = useMemo((): UnifiedMarker[] => {
    const out: UnifiedMarker[] = [];

    for (const f of FLASHDRIVES) {
      if (f.worldX == null || f.worldY == null) continue;
      const done = collectedKeys.has(f.blueprintKey);
      // Quest-only (НДІЧАЗ) stays red so it remains identifiable
      const tone = f.questOnly
        ? "quest-only"
        : done
          ? "collected"
          : "missing";
      out.push({
        key: `fr-${f.id}`,
        layer: "flash-royale",
        worldX: f.worldX,
        worldY: f.worldY,
        titleUk: f.nameUk,
        titleEn: f.nameEn,
        metaUk: `${f.region} · флешка`,
        metaEn: `${f.regionEn || f.region} · flash drive`,
        detail: f.accessUk,
        done,
        mapHref: `/flash-royale?id=${f.id}`,
        html: flashMarkerHtml(tone),
      });
    }

    for (const f of ANOMALY_FIELDS) {
      const worth = missingTypes.has(f.anomalyType);
      out.push({
        key: `mh-${f.id}`,
        layer: "miracle-hoarder",
        worldX: f.worldX,
        worldY: f.worldY,
        titleUk: f.nameUk,
        titleEn: f.nameEn,
        metaUk: `${f.region} · поле аномалії`,
        metaEn: `${f.region} · anomaly field`,
        detail: f.notes,
        done: !worth,
        mapHref: `/miracle-hoarder?id=${f.id}`,
        html: anomalyTypeMarkerHtml(f.anomalyType, { done: !worth }),
      });
    }

    for (const s of SCANNERS) {
      const done = collectedScannerIds.has(s.id);
      out.push({
        key: `sc-${s.id}`,
        layer: "scanning-complete",
        worldX: s.worldX,
        worldY: s.worldY,
        titleUk: s.nameUk,
        titleEn: s.nameEn,
        metaUk: `${s.region} · сканер · ${s.artifactNameUk}`,
        metaEn: `${s.regionEn || s.region} · scanner · ${s.artifactNameEn}`,
        detail: s.accessUk,
        done,
        mapHref: `/scanning-complete?id=${s.id}`,
        html: scannerMarkerHtml(done),
      });
    }

    for (const a of ARCH_ARTIFACTS) {
      const done = collectedArchArtifactIds.has(a.id);
      out.push({
        key: `aa-${a.id}`,
        layer: "curiouser-curiouser",
        worldX: a.worldX,
        worldY: a.worldY,
        titleUk: a.nameUk,
        titleEn: a.nameEn,
        metaUk: `${a.region} · ${a.anomalyUk}`,
        metaEn: `${a.regionEn || a.region} · ${a.anomalyEn}`,
        detail: a.accessUk,
        done,
        mapHref: `/curiouser-curiouser?id=${a.id}`,
        html: archMarkerHtml(done),
      });
    }

    for (const can of NON_STOP_CANS) {
      const done = collectedNonStopIds.has(can.id);
      out.push({
        key: `ns-${can.id}`,
        layer: "non-stop",
        worldX: can.worldX,
        worldY: can.worldY,
        titleUk: can.nameUk,
        titleEn: can.nameEn,
        metaUk: `${can.region} · non-stop`,
        metaEn: `${can.regionEn || can.region} · non-stop`,
        detail: can.accessUk,
        done,
        mapHref: `/non-stop?id=${can.id}`,
        html: nonStopMarkerHtml(done),
      });
    }

    return out;
  }, [
    collectedKeys,
    collectedScannerIds,
    collectedArchArtifactIds,
    collectedNonStopIds,
    missingTypes,
  ]);

  const filtered = useMemo(
    () => markers.filter((m) => layers[m.layer]),
    [markers, layers],
  );

  const selected = useMemo(
    () => markers.find((m) => m.key === selectedKey) ?? null,
    [markers, selectedKey],
  );

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
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const m of filtered) {
      const size =
        m.layer === "miracle-hoarder" ? ANOMALY_MARKER_SIZE : TRACKER_MARKER_SIZE;
      const icon = L.divIcon({
        className: wrapClass(m.layer),
        html: m.html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker(worldToLatLng(m.worldX, m.worldY), { icon });
      marker.on("click", () => {
        setSelectedKey(m.key);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("id", m.key);
          return next;
        });
      });
      marker.addTo(group);
    }
  }, [filtered, setParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedKey) return;
    const m = markers.find((d) => d.key === selectedKey);
    if (!m) return;
    map.setView(worldToLatLng(m.worldX, m.worldY), Math.max(map.getZoom(), 4), {
      animate: true,
    });
  }, [selectedKey, markers]);

  useEffect(() => {
    if (focusId) setSelectedKey(focusId);
  }, [focusId]);

  const closeSheet = () => {
    setSelectedKey(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  };

  const toggleLayer = (id: LayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flashDone = UNIQUE_BLUEPRINT_KEYS.filter((k) =>
    collectedKeys.has(k),
  ).length;

  return (
    <div className="page map-page">
      <div className="map-tools">
        <MapSidePanel title={t("mapPanelTitle")}>
          <div className="map-filters-card">
            <div className="filters map-filters all-map-layers" role="group" aria-label={t("layers")}>
              {layerIds.map((id) => (
                <label key={id} className="check-label">
                  <input
                    type="checkbox"
                    checked={layers[id]}
                    onChange={() => toggleLayer(id)}
                  />
                  {locName(ACHIEVEMENTS[id], locale)}
                </label>
              ))}
            </div>
          </div>

          <MapLegend>
            <ul className="hint map-legend">
            <li>
              <span className="fr-marker fr-marker-missing legend-swatch">
                <FlashGlyph size={16} />
              </span>
              {t("legendFlash")} ({flashDone}/{UNIQUE_BLUEPRINT_KEYS.length})
            </li>
            <li>
              <span className="mh-marker mh-marker-worth legend-swatch">
                <AnomalyTypeIcon type="chemical" size={16} color="#fff8ef" />
              </span>
              {t("legendAnomalies")}
            </li>
            <li>
              <span className="sc-marker sc-marker-missing legend-swatch">
                <ScannerGlyph size={16} />
              </span>
              {t("legendScanners")} ({collectedScannerIds.size}/{SCANNERS.length})
            </li>
            <li>
              <span className="aa-marker aa-marker-missing legend-swatch">
                <StarGlyph size={16} />
              </span>
              {t("legendArch")} ({collectedArchArtifactIds.size}/{ARCH_ARTIFACTS.length})
            </li>
            <li>
              <span className="ns-marker ns-marker-missing legend-swatch">
                <NonStopGlyph height={16} />
              </span>
              {t("legendNonStop")} ({collectedNonStopIds.size}/{NON_STOP_CANS.length})
            </li>
            </ul>
          </MapLegend>
        </MapSidePanel>
        <GuaranteeFab title={t("allMapTitle")}>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              {t("allMapIntroBefore")}{" "}
              <Link className="layer-link layer-link-fr" to="/flash-royale">
                {t("allMapLinkFlash")}
              </Link>
              ,{" "}
              <Link className="layer-link layer-link-mh" to="/miracle-hoarder">
                {t("allMapLinkAnomalies")}
              </Link>
              ,{" "}
              <Link
                className="layer-link layer-link-sc"
                to="/scanning-complete"
              >
                {t("allMapLinkScanners")}
              </Link>
              ,{" "}
              <Link
                className="layer-link layer-link-aa"
                to="/curiouser-curiouser"
              >
                {t("allMapLinkArch")}
              </Link>
              ,{" "}
              <Link className="layer-link layer-link-ns" to="/non-stop">
                {t("allMapLinkNonStop")}
              </Link>
              {t("allMapIntroAfter")}
            </span>
          </li>
        </ul>
      </GuaranteeFab>
      </div>

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
          role="application"
          aria-label={t("mapAriaAll")}
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
              {locale === "uk" ? selected.titleUk : selected.titleEn}
              <span className="sheet-title-en">
                {locale === "uk" ? selected.titleEn : selected.titleUk}
              </span>
            </h2>
            <p className="flash-meta">
              {locName(ACHIEVEMENTS[selected.layer], locale)} ·{" "}
              {locale === "uk" ? selected.metaUk : selected.metaEn}
              {selected.done ? t("allMapDoneSuffix") : ""}
            </p>
            {selected.detail && <p className="notes">{selected.detail}</p>}
            <div className="choice-actions">
              <Link className="btn" to={selected.mapHref}>
                {t("allMapOpenInAch")}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
