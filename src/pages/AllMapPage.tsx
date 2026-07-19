import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ANOMALY_FIELDS,
  ARCH_ARTIFACTS,
  FLASHDRIVES,
  SCANNERS,
  UNIQUE_BLUEPRINT_KEYS,
  missingArtifactTypes,
} from "../data/catalog";
import { useProgress } from "../hooks/useProgress";
import {
  MAP_BOUNDS,
  MAP_CENTER,
  TILE_ATTR,
  TILE_URL,
  worldToLatLng,
} from "../lib/mapCoords";

type LayerId =
  | "flash-royale"
  | "miracle-hoarder"
  | "scanning-complete"
  | "curiouser-curiouser";

type UnifiedMarker = {
  key: string;
  layer: LayerId;
  worldX: number;
  worldY: number;
  titleUk: string;
  titleEn: string;
  meta: string;
  detail?: string;
  done: boolean;
  mapHref: string;
  html: string;
};

const LAYER_LABELS: Record<LayerId, string> = {
  "flash-royale": "Flash Royale",
  "miracle-hoarder": "Miracle Hoarder",
  "scanning-complete": "Scanning Complete",
  "curiouser-curiouser": "Curiouser",
};

function wrapClass(layer: LayerId): string {
  if (layer === "flash-royale") return "fr-marker-wrap";
  if (layer === "miracle-hoarder") return "mh-marker-wrap";
  if (layer === "scanning-complete") return "sc-marker-wrap";
  return "aa-marker-wrap";
}

export function AllMapPage() {
  const {
    collectedKeys,
    collectedArtifactIds,
    collectedScannerIds,
    collectedArchArtifactIds,
  } = useProgress();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("id");

  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    "flash-royale": true,
    "miracle-hoarder": true,
    "scanning-complete": true,
    "curiouser-curiouser": true,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(focusId);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const missingTypes = useMemo(
    () => missingArtifactTypes(collectedArtifactIds),
    [collectedArtifactIds],
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
        meta: `${f.region} · флешка`,
        detail: f.accessUk,
        done,
        mapHref: `/flash-royale?id=${f.id}`,
        html: `<span class="fr-marker fr-marker-${tone}">${done ? "✓" : "◆"}</span>`,
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
        meta: `${f.region} · поле аномалії`,
        detail: f.notes,
        done: !worth,
        mapHref: `/miracle-hoarder?id=${f.id}`,
        html: `<span class="mh-marker mh-marker-${worth ? "worth" : "done"}">◆</span>`,
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
        meta: `${s.region} · сканер · ${s.artifactNameUk}`,
        detail: s.accessUk,
        done,
        mapHref: `/scanning-complete?id=${s.id}`,
        html: `<span class="sc-marker sc-marker-${done ? "collected" : "missing"}">${done ? "✓" : "◆"}</span>`,
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
        meta: `${a.region} · ${a.anomalyUk}`,
        detail: a.accessUk,
        done,
        mapHref: `/curiouser-curiouser?id=${a.id}`,
        html: `<span class="aa-marker aa-marker-${done ? "collected" : "missing"}">${done ? "✓" : "◆"}</span>`,
      });
    }

    return out;
  }, [
    collectedKeys,
    collectedScannerIds,
    collectedArchArtifactIds,
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
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const m of filtered) {
      const icon = L.divIcon({
        className: wrapClass(m.layer),
        html: m.html,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
      <section className="guarantee-card" aria-labelledby="all-map-title">
        <h2 id="all-map-title">Усі маркери</h2>
        <ul className="guarantee-list">
          <li>
            <span className="guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M10.88 1.93a1 1 0 0 0-1.76 0L1.12 16.07A1 1 0 0 0 2 17.5h16a1 1 0 0 0 .88-1.43L10.88 1.93zM10 7.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8A.75.75 0 0 1 10 7.25zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            </span>
            <span>
              На одній мапі:{" "}
              <Link className="layer-link layer-link-fr" to="/flash-royale">
                флешки
              </Link>
              ,{" "}
              <Link className="layer-link layer-link-mh" to="/miracle-hoarder">
                поля аномалій
              </Link>
              ,{" "}
              <Link
                className="layer-link layer-link-sc"
                to="/scanning-complete"
              >
                сканери
              </Link>
              ,{" "}
              <Link
                className="layer-link layer-link-aa"
                to="/curiouser-curiouser"
              >
                архіартефакти
              </Link>
              . Увімкніть/вимкніть шари нижче.
            </span>
          </li>
        </ul>
      </section>

      <div className="map-stage">
        <div
          ref={mapEl}
          className="pda-map"
          role="application"
          aria-label="Мапа Зони — усі маркери"
        />

        {selected && (
          <aside className="map-sheet" aria-live="polite">
            <button
              type="button"
              className="sheet-close"
              onClick={closeSheet}
              aria-label="Закрити"
            >
              ×
            </button>
            <h2 className="sheet-title">
              {selected.titleUk}
              <span className="sheet-title-en">{selected.titleEn}</span>
            </h2>
            <p className="flash-meta">
              {LAYER_LABELS[selected.layer]} · {selected.meta}
              {selected.done ? " · зібрано / закрито" : ""}
            </p>
            {selected.detail && <p className="notes">{selected.detail}</p>}
            <div className="choice-actions">
              <Link className="btn" to={selected.mapHref}>
                Відкрити в ачівці
              </Link>
            </div>
          </aside>
        )}
      </div>

      <div className="map-filters-card">
        <div className="filters map-filters all-map-layers" role="group" aria-label="Шари">
          {(Object.keys(LAYER_LABELS) as LayerId[]).map((id) => (
            <label key={id} className="check-label">
              <input
                type="checkbox"
                checked={layers[id]}
                onChange={() => toggleLayer(id)}
              />
              {LAYER_LABELS[id]}
            </label>
          ))}
        </div>
      </div>

      <p className="hint map-legend">
        <span className="fr-marker fr-marker-missing legend-swatch">◆</span>{" "}
        флешки ({flashDone}/{UNIQUE_BLUEPRINT_KEYS.length}){" "}
        <span className="mh-marker mh-marker-worth legend-swatch">◆</span>{" "}
        аномалії{" "}
        <span className="sc-marker sc-marker-missing legend-swatch">◆</span>{" "}
        сканери ({collectedScannerIds.size}/{SCANNERS.length}){" "}
        <span className="aa-marker aa-marker-missing legend-swatch">◆</span>{" "}
        архі ({collectedArchArtifactIds.size}/{ARCH_ARTIFACTS.length})
      </p>
    </div>
  );
}
