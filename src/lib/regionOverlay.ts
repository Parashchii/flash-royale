import L from "leaflet";
import type { Feature, FeatureCollection, Position } from "geojson";
import regionsJson from "../data/regions.json";

const regions = regionsJson as FeatureCollection;

const IDLE: L.PathOptions = {
  stroke: true,
  color: "#fff",
  weight: 1,
  opacity: 0.42,
  fill: true,
  fillColor: "#fff",
  fillOpacity: 0,
};

const HOVER: L.PathOptions = {
  stroke: true,
  color: "#fff",
  weight: 1.25,
  opacity: 0.85,
  fill: true,
  fillColor: "#fff",
  fillOpacity: 0.12,
};

type RegionProps = { region?: string; regionEn?: string };

function ringCentroid(ring: Position[]): [number, number] | null {
  if (ring.length < 3) return null;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    twiceArea += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(twiceArea) < 1e-8) {
    const mid = ring[Math.floor(ring.length / 2)];
    return [mid[1], mid[0]];
  }
  const a = twiceArea * 3;
  return [cy / a, cx / a];
}

function featureCentroid(feature: Feature): [number, number] | null {
  const geom = feature.geometry;
  if (!geom) return null;
  if (geom.type === "Polygon") return ringCentroid(geom.coordinates[0]);
  if (geom.type === "MultiPolygon") {
    let best: [number, number] | null = null;
    let bestAbs = 0;
    for (const poly of geom.coordinates) {
      const c = ringCentroid(poly[0]);
      if (!c) continue;
      const abs = Math.abs(poly[0].length);
      if (abs >= bestAbs) {
        bestAbs = abs;
        best = c;
      }
    }
    return best;
  }
  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function regionLabel(props: RegionProps | null | undefined): string {
  const lang = document.documentElement.lang === "en" ? "en" : "uk";
  const raw = (lang === "en" ? props?.regionEn : props?.region) || props?.region || "";
  return raw.toLocaleUpperCase(lang === "en" ? "en" : "uk");
}

/** Transparent region polygons; hover shows a white edge, light fill, and name. */
export function addRegionHoverLayer(map: L.Map): L.GeoJSON {
  let label: L.Marker | null = null;

  const clearLabel = () => {
    if (!label) return;
    map.removeLayer(label);
    label = null;
  };

  const layer = L.geoJSON(regions, {
    style: () => IDLE,
    interactive: true,
    bubblingMouseEvents: true,
    onEachFeature: (feature, lyr) => {
      const path = lyr as L.Path;
      const center = featureCentroid(feature);
      path.on({
        mouseover: () => {
          path.setStyle(HOVER);
          path.bringToFront();
          clearLabel();
          if (!center) return;
          const name = regionLabel(feature.properties as RegionProps);
          if (!name) return;
          label = L.marker(center, {
            icon: L.divIcon({
              className: "map-region-label",
              html: `<span>${escapeHtml(name)}</span>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            interactive: false,
            keyboard: false,
            zIndexOffset: 2500,
          });
          label.addTo(map);
        },
        mouseout: () => {
          path.setStyle(IDLE);
          clearLabel();
        },
      });
    },
  });
  layer.addTo(map);
  return layer;
}
