import L from "leaflet";

/** UE5 landscape square used by joric PDA tileset (units). */
export const WORLD_SIZE = 812900;

/** Leaflet CRS.Simple map size at zoom 0 with tileSize 512. */
export const MAP_SIZE = 512;

export type LatLngTuple = [number, number];

/**
 * Convert in-game world X/Y to Leaflet CRS.Simple [lat, lng].
 * World: X east, Y south, origin near NW of the 812900 square.
 * Leaflet Simple tiles: y grows down from 0 → -512, x grows right 0 → 512.
 */
export function worldToLatLng(worldX: number, worldY: number): LatLngTuple {
  const lng = (worldX / WORLD_SIZE) * MAP_SIZE;
  const lat = -(worldY / WORLD_SIZE) * MAP_SIZE;
  return [lat, lng];
}

export function latLngToWorld(lat: number, lng: number): { x: number; y: number } {
  return {
    x: (lng / MAP_SIZE) * WORLD_SIZE,
    y: (-lat / MAP_SIZE) * WORLD_SIZE,
  };
}

export const MAP_BOUNDS = L.latLngBounds(
  L.latLng(0, 0),
  L.latLng(-MAP_SIZE, MAP_SIZE),
);

export const MAP_CENTER: LatLngTuple = [-MAP_SIZE / 2, MAP_SIZE / 2];

export const TILE_URL =
  "https://joric.github.io/stalker2_tileset/tiles/{z}/{x}/{y}.jpg";

export const TILE_ATTR =
  'PDA map tiles © GSC Game World · hosted by <a href="https://github.com/joric/stalker2_tileset" target="_blank" rel="noreferrer">joric</a>';
