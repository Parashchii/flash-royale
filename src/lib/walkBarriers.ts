import { WORLD_SIZE, worldToCell, type WalkGrid } from "./pathfinding";

type WorldLine = { x1: number; y1: number; x2: number; y2: number; width: number };
type WorldRect = { x0: number; y0: number; x1: number; y1: number };

/** Leaflet CRS.Simple lng/lat → UE world (same as mapCoords). */
function ll(lng: number, lat: number): { x: number; y: number } {
  return {
    x: (lng / 512) * WORLD_SIZE,
    y: (-lat / 512) * WORLD_SIZE,
  };
}

function line(a: { x: number; y: number }, b: { x: number; y: number }, width: number): WorldLine {
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, width };
}

/**
 * Game-impossible shortcuts the satellite mask cannot see:
 * fences, station-only rail crossing, Pripyat gate, rivers without a ford.
 */
const WALLS: WorldLine[] = [
  // Railway through Yaniv — only the station hall is a legal N/S crossing.
  line(ll(90.6, -186.2), ll(124.5, -184.4), 16000),
  line(ll(156.5, -183.2), ll(208.0, -181.4), 16000),

  // Pripyat south / east — enter only via the long NW road to Energetik.
  line(ll(129.98, -124.16), ll(158.43, -143.46), 14000),
  line(ll(158.43, -143.46), ll(176.16, -132.17), 14000),
  line(ll(176.16, -132.17), ll(187.83, -123.97), 14000),
  line(ll(187.83, -123.97), ll(198.74, -115.01), 14000),
  line(ll(198.74, -115.01), ll(187.06, -99.74), 12000),

  // Cordon / Zalissya cannot ford the river onto Wild Island.
  line(ll(297.5, -368.0), ll(325.0, -392.0), 22000),
  line(ll(312.2, -408.9), ll(341.3, -368.6), 20000),
];

/** Keep the intended corridors walkable after walls are stamped. */
const GATES: WorldRect[] = [
  // Yaniv station platform / hall
  { x0: 198000, y0: 278000, x1: 246000, y1: 308000 },
];

/** Rooftops the mask treats as land — stay on roads around Yaniv station. */
const BLOCKS: WorldRect[] = [
  { x0: 228000, y0: 268000, x1: 252000, y1: 286000 },
  { x0: 199000, y0: 270000, x1: 214000, y1: 289000 },
];

function idx(x: number, y: number, size: number) {
  return y * size + x;
}

function stampDisk(
  walkable: Uint8Array,
  size: number,
  cx: number,
  cy: number,
  radius: number,
  value: number,
) {
  const r = Math.max(1, Math.ceil(radius));
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(size - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(size - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) walkable[idx(x, y, size)] = value;
    }
  }
}

function stampLine(grid: WalkGrid, wall: WorldLine, value: number) {
  const a = worldToCell(wall.x1, wall.y1, grid.size);
  const b = worldToCell(wall.x2, wall.y2, grid.size);
  const radius = (wall.width / WORLD_SIZE) * grid.size * 0.5;
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stampDisk(
      grid.walkable,
      grid.size,
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      radius,
      value,
    );
  }
}

function forRect(grid: WalkGrid, rect: WorldRect, fn: (i: number) => void) {
  const a = worldToCell(rect.x0, rect.y0, grid.size);
  const b = worldToCell(rect.x1, rect.y1, grid.size);
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) fn(idx(x, y, grid.size));
  }
}

/**
 * Clip cells that sit mostly in water (6+ dark neighbors).
 * Forest shadows only nibble 1–3 neighbors, so roads stay open.
 */
export function tightenWater(grid: WalkGrid) {
  const { size, walkable } = grid;
  const raw = walkable.slice();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = idx(x, y, size);
      if (!raw[i]) continue;
      let dark = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size || !raw[idx(nx, ny, size)]) {
            dark += 1;
          }
        }
      }
      if (dark >= 6) walkable[i] = 0;
    }
  }
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = idx(x, y, size);
      if (walkable[i] || !raw[i]) continue;
      const n = raw[idx(x, y - 1, size)];
      const s = raw[idx(x, y + 1, size)];
      const e = raw[idx(x + 1, y, size)];
      const w = raw[idx(x - 1, y, size)];
      if ((n && s && (!e || !w)) || (e && w && (!n || !s))) walkable[i] = 1;
    }
  }
}

export function applyWalkBarriers(grid: WalkGrid) {
  const orig = grid.walkable.slice();
  for (const wall of WALLS) stampLine(grid, wall, 0);
  for (const block of BLOCKS) {
    forRect(grid, block, (i) => {
      grid.walkable[i] = 0;
    });
  }
  for (const gate of GATES) {
    forRect(grid, gate, (i) => {
      if (orig[i]) grid.walkable[i] = 1;
    });
  }
}

export function finalizeWalkGrid(grid: WalkGrid): WalkGrid {
  tightenWater(grid);
  applyWalkBarriers(grid);
  return grid;
}
