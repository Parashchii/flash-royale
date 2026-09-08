import walkabilityUrl from "../assets/maps/walkability.png";
import walkabilityOverlayUrl from "../assets/maps/walkability-overlay.png";
import { ASTAR_GRID_SIZE, type WalkGrid } from "./pathfinding";
import { finalizeWalkGrid } from "./walkBarriers";

export const WALKABILITY_URL = walkabilityUrl;
export const WALKABILITY_OVERLAY_URL = walkabilityOverlayUrl;

let cached: Promise<WalkGrid> | null = null;

export function loadWalkGrid(): Promise<WalkGrid> {
  if (!cached) cached = decodeWalkGrid();
  return cached;
}

async function decodeWalkGrid(): Promise<WalkGrid> {
  const img = new Image();
  img.decoding = "async";
  img.src = walkabilityUrl;
  await img.decode();

  const srcSize = img.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = srcSize;
  canvas.height = srcSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("walkability canvas");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, srcSize, srcSize);

  const size = ASTAR_GRID_SIZE;
  const walkable = new Uint8Array(size * size);
  const scale = srcSize / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bright = 0;
      const x0 = Math.floor(x * scale);
      const y0 = Math.floor(y * scale);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y0 + dy) * srcSize + (x0 + dx)) * 4;
          if (data[i] > 127) bright += 1;
        }
      }
      walkable[y * size + x] = bright > 0 ? 1 : 0;
    }
  }
  return finalizeWalkGrid({ size, walkable });
}
