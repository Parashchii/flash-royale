import type { WorldPoint } from "./pathfinding";

/** Drop colinear grid vertices so fillets can round real corners. */
export function simplifyRoute(points: WorldPoint[]): WorldPoint[] {
  if (points.length < 3) return points.slice();
  const out: WorldPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    const cross = abx * bcy - aby * bcx;
    if (Math.abs(cross) > 1) out.push(b);
  }
  out.push(points[points.length - 1]);
  return out;
}

function len(x: number, y: number) {
  return Math.hypot(x, y);
}

/**
 * Replace sharp corners with a short circular fillet so the dashed stroke
 * reads as a road rather than a grid staircase.
 */
export function filletRoute(points: WorldPoint[], radius: number, steps = 5): WorldPoint[] {
  if (points.length < 3 || radius <= 0) return points.slice();
  const out: WorldPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const l1 = len(v1x, v1y);
    const l2 = len(v2x, v2y);
    if (l1 < 1 || l2 < 1) {
      out.push(b);
      continue;
    }
    const u1x = v1x / l1;
    const u1y = v1y / l1;
    const u2x = v2x / l2;
    const u2y = v2y / l2;
    const dot = Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y));
    const angle = Math.acos(dot);
    if (!Number.isFinite(angle) || angle < 0.12 || angle > Math.PI - 0.08) {
      out.push(b);
      continue;
    }
    const trim = Math.min(radius / Math.tan(angle / 2), l1 * 0.45, l2 * 0.45);
    const p1 = { x: b.x + u1x * trim, y: b.y + u1y * trim };
    const p2 = { x: b.x + u2x * trim, y: b.y + u2y * trim };
    out.push(p1);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const omt = 1 - t;
      out.push({
        x: omt * omt * p1.x + 2 * omt * t * b.x + t * t * p2.x,
        y: omt * omt * p1.y + 2 * omt * t * b.y + t * t * p2.y,
      });
    }
    out.push(p2);
  }
  out.push(points[points.length - 1]);
  return out;
}

export function styleRouteLine(points: WorldPoint[], radius = 4200): WorldPoint[] {
  return filletRoute(simplifyRoute(points), radius);
}
