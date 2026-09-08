import {
  planRoute,
  type RouteGoal,
  type RoutePlan,
  type WalkGrid,
  type WorldPoint,
} from "./pathfinding";
import { loadWalkGrid } from "./walkability";

type WorkerResult = RoutePlan & { type: "result"; requestId: number };
type WorkerReady = { type: "ready" };

let worker: Worker | null = null;
let workerReady = false;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (plan: RoutePlan) => void; reject: (err: Error) => void }
>();

function ensureWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./routeWorker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
  worker.onmessage = (event: MessageEvent<WorkerResult | WorkerReady>) => {
    const msg = event.data;
    if (msg.type === "ready") {
      workerReady = true;
      return;
    }
    if (msg.type === "result") {
      const wait = pending.get(msg.requestId);
      if (!wait) return;
      pending.delete(msg.requestId);
      wait.resolve({
        stops: msg.stops,
        unreachable: msg.unreachable,
        polyline: msg.polyline,
      });
    }
  };
  worker.onerror = () => {
    workerReady = false;
  };
  return worker;
}

async function initWorker(grid: WalkGrid): Promise<boolean> {
  const w = ensureWorker();
  if (!w) return false;
  if (workerReady) return true;
  w.postMessage({
    type: "init",
    size: grid.size,
    walkable: grid.walkable,
  });
  const started = Date.now();
  while (!workerReady && Date.now() - started < 4000) {
    await new Promise((r) => setTimeout(r, 20));
  }
  return workerReady;
}

export async function computeFarmRoute(
  start: WorldPoint,
  goals: RouteGoal[],
  limit: number | null,
): Promise<RoutePlan> {
  const grid = await loadWalkGrid();
  const ok = await initWorker(grid);
  if (!ok || !worker) {
    return planRoute(grid, start, goals, limit);
  }
  const requestId = nextId++;
  return new Promise<RoutePlan>((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    worker!.postMessage({
      type: "plan",
      requestId,
      start,
      goals,
      limit,
    });
  });
}
