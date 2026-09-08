/** Same as mapCoords.WORLD_SIZE — kept here so the worker stays Leaflet-free. */
export const WORLD_SIZE = 812900;

/** A* grid resolution (walkability PNG is 1024 and downsampled 2×). */
export const ASTAR_GRID_SIZE = 512;

const SQRT2 = Math.SQRT2;
const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

export type WalkGrid = {
  size: number;
  walkable: Uint8Array;
};

export type WorldPoint = { x: number; y: number };

export type RouteGoal = {
  id: string;
  x: number;
  y: number;
};

export type RouteStop = {
  id: string;
  cost: number;
};

export type RoutePlan = {
  stops: RouteStop[];
  unreachable: string[];
  polyline: WorldPoint[];
};

export function worldToCell(
  worldX: number,
  worldY: number,
  size = ASTAR_GRID_SIZE,
): { x: number; y: number } {
  const x = Math.max(0, Math.min(size - 1, Math.floor((worldX / WORLD_SIZE) * size)));
  const y = Math.max(0, Math.min(size - 1, Math.floor((worldY / WORLD_SIZE) * size)));
  return { x, y };
}

export function cellToWorld(
  cellX: number,
  cellY: number,
  size = ASTAR_GRID_SIZE,
): WorldPoint {
  return {
    x: ((cellX + 0.5) / size) * WORLD_SIZE,
    y: ((cellY + 0.5) / size) * WORLD_SIZE,
  };
}

function idx(x: number, y: number, size: number) {
  return y * size + x;
}

function isWalk(grid: WalkGrid, x: number, y: number) {
  if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) return false;
  return grid.walkable[idx(x, y, grid.size)] !== 0;
}

export function snapToWalkable(
  grid: WalkGrid,
  x: number,
  y: number,
  maxR = 24,
): { x: number; y: number } | null {
  if (isWalk(grid, x, y)) return { x, y };
  for (let r = 1; r <= maxR; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (isWalk(grid, nx, ny)) return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function octile(ax: number, ay: number, bx: number, by: number) {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}

type AStarHit = { cost: number; cells: { x: number; y: number }[] };

function astar(
  grid: WalkGrid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): AStarHit | null {
  if (ax === bx && ay === by) return { cost: 0, cells: [{ x: ax, y: ay }] };

  const size = grid.size;
  const n = size * size;
  const gScore = new Float64Array(n);
  gScore.fill(Number.POSITIVE_INFINITY);
  const came = new Int32Array(n);
  came.fill(-1);
  const startI = idx(ax, ay, size);
  const goalI = idx(bx, by, size);
  gScore[startI] = 0;

  const heapX: number[] = [ax];
  const heapY: number[] = [ay];
  const heapF: number[] = [octile(ax, ay, bx, by)];

  const swim = (i: number) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapF[p] <= heapF[i]) break;
      swap(i, p);
      i = p;
    }
  };
  const sink = (i: number) => {
    const len = heapF.length;
    while (true) {
      const l = i * 2 + 1;
      const r = l + 1;
      let s = i;
      if (l < len && heapF[l] < heapF[s]) s = l;
      if (r < len && heapF[r] < heapF[s]) s = r;
      if (s === i) break;
      swap(i, s);
      i = s;
    }
  };
  const swap = (i: number, j: number) => {
    let t = heapF[i];
    heapF[i] = heapF[j];
    heapF[j] = t;
    t = heapX[i];
    heapX[i] = heapX[j];
    heapX[j] = t;
    t = heapY[i];
    heapY[i] = heapY[j];
    heapY[j] = t;
  };

  while (heapF.length) {
    const cx = heapX[0];
    const cy = heapY[0];
    const last = heapF.length - 1;
    heapF[0] = heapF[last];
    heapX[0] = heapX[last];
    heapY[0] = heapY[last];
    heapF.pop();
    heapX.pop();
    heapY.pop();
    if (heapF.length) sink(0);

    const ci = idx(cx, cy, size);
    if (ci === goalI) {
      const cells: { x: number; y: number }[] = [];
      let i = goalI;
      while (i >= 0) {
        cells.push({ x: i % size, y: (i / size) | 0 });
        i = came[i];
      }
      cells.reverse();
      return { cost: gScore[goalI], cells };
    }

    const g0 = gScore[ci];
    for (const [dx, dy, step] of NEIGHBORS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!isWalk(grid, nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (!isWalk(grid, cx + dx, cy) || !isWalk(grid, cx, cy + dy)) continue;
      }
      const ni = idx(nx, ny, size);
      const tentative = g0 + step;
      if (tentative >= gScore[ni]) continue;
      gScore[ni] = tentative;
      came[ni] = ci;
      heapX.push(nx);
      heapY.push(ny);
      heapF.push(tentative + octile(nx, ny, bx, by));
      swim(heapF.length - 1);
    }
  }

  return null;
}

function pathKey(ax: number, ay: number, bx: number, by: number) {
  return `${ax},${ay}-${bx},${by}`;
}

function cellsToWorld(cells: { x: number; y: number }[], size: number): WorldPoint[] {
  const out: WorldPoint[] = [];
  for (const c of cells) {
    const p = cellToWorld(c.x, c.y, size);
    const prev = out[out.length - 1];
    if (prev && prev.x === p.x && prev.y === p.y) continue;
    out.push(p);
  }
  return out;
}

export function planRoute(
  grid: WalkGrid,
  start: WorldPoint,
  goals: RouteGoal[],
  limit: number | null,
): RoutePlan {
  const startWorldCell = worldToCell(start.x, start.y, grid.size);
  const startCell = snapToWalkable(grid, startWorldCell.x, startWorldCell.y);
  if (!startCell) {
    return { stops: [], unreachable: goals.map((g) => g.id), polyline: [] };
  }

  const snapped = new Map<string, { x: number; y: number }>();
  const unreachable: string[] = [];
  const remaining: RouteGoal[] = [];
  for (const g of goals) {
    const c = worldToCell(g.x, g.y, grid.size);
    const s = snapToWalkable(grid, c.x, c.y);
    if (!s) {
      unreachable.push(g.id);
      continue;
    }
    snapped.set(g.id, s);
    remaining.push(g);
  }

  const cache = new Map<string, AStarHit | null>();
  const findPath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const k = pathKey(a.x, a.y, b.x, b.y);
    if (cache.has(k)) return cache.get(k) ?? null;
    const hit = astar(grid, a.x, a.y, b.x, b.y);
    cache.set(k, hit);
    return hit;
  };

  const cap = limit == null ? remaining.length : Math.max(0, limit);
  const stops: RouteStop[] = [];
  const polyline: WorldPoint[] = [cellToWorld(startCell.x, startCell.y, grid.size)];
  let current = startCell;

  while (remaining.length && stops.length < cap) {
    let bestI = -1;
    let bestHit: AStarHit | null = null;
    for (let i = 0; i < remaining.length; i++) {
      const cell = snapped.get(remaining[i].id);
      if (!cell) continue;
      const hit = findPath(current, cell);
      if (!hit) continue;
      if (!bestHit || hit.cost < bestHit.cost) {
        bestHit = hit;
        bestI = i;
      }
    }
    if (bestI < 0 || !bestHit) break;
    const [picked] = remaining.splice(bestI, 1);
    stops.push({ id: picked.id, cost: bestHit.cost });
    const worldCells = cellsToWorld(bestHit.cells, grid.size);
    for (let i = 1; i < worldCells.length; i++) polyline.push(worldCells[i]);
    current = snapped.get(picked.id) ?? current;
  }

  if (stops.length < cap) {
    for (const left of remaining) unreachable.push(left.id);
  }

  return { stops, unreachable, polyline };
}

/** Orthogonal cell length in metres (UE landscape is centimetres). */
const CELL_METERS = WORLD_SIZE / ASTAR_GRID_SIZE / 100;
/** Mixed walk / jog used only for the UI estimate. */
const EST_MPS = 3;

export function routeDurationSec(stops: RouteStop[]): number {
  const cells = stops.reduce((sum, stop) => sum + stop.cost, 0);
  return (cells * CELL_METERS) / EST_MPS;
}

export function formatRouteTime(sec: number, locale: "uk" | "en"): string {
  const mins = Math.max(1, Math.round(sec / 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (locale === "uk") {
    if (h <= 0) return `${m} хв`;
    return m ? `${h} год ${m} хв` : `${h} год`;
  }
  if (h <= 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
