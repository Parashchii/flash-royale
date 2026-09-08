import { planRoute, type RouteGoal, type WorldPoint, type WalkGrid } from "./pathfinding";

type InitMsg = {
  type: "init";
  size: number;
  walkable: Uint8Array;
};

type PlanMsg = {
  type: "plan";
  requestId: number;
  start: WorldPoint;
  goals: RouteGoal[];
  limit: number | null;
};

let grid: WalkGrid | null = null;

self.onmessage = (event: MessageEvent<InitMsg | PlanMsg>) => {
  const msg = event.data;
  if (msg.type === "init") {
    grid = { size: msg.size, walkable: msg.walkable };
    self.postMessage({ type: "ready" });
    return;
  }
  if (msg.type === "plan") {
    if (!grid) {
      self.postMessage({
        type: "result",
        requestId: msg.requestId,
        stops: [],
        unreachable: msg.goals.map((g) => g.id),
        polyline: [],
      });
      return;
    }
    const plan = planRoute(grid, msg.start, msg.goals, msg.limit);
    self.postMessage({ type: "result", requestId: msg.requestId, ...plan });
  }
};
