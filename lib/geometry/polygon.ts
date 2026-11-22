import type { Point } from "@/lib/types";

export const EPS = 1e-6;

export const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
export const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

export const unit = (v: Point): Point => {
  const l = Math.hypot(v.x, v.y);
  return l < EPS ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
};

export interface Wall {
  a: Point;
  b: Point;
  index: number;
}

export const wallOf = (poly: Point[], i: number): Wall => ({
  a: poly[i],
  b: poly[(i + 1) % poly.length],
  index: i,
});

export const walls = (poly: Point[]): Wall[] => poly.map((_, i) => wallOf(poly, i));

export const wallLength = (poly: Point[], i: number) => {
  const w = wallOf(poly, i);
  return dist(w.a, w.b);
};

export const wallDirection = (poly: Point[], i: number) => {
  const w = wallOf(poly, i);
  return unit(sub(w.b, w.a));
};

/** 화면 좌표(y 아래) 기준 shoelace. 양수 = 시계방향 */
export const signedArea = (poly: Point[]) => {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
};

export const polygonArea = (poly: Point[]) => Math.abs(signedArea(poly));
export const isClockwise = (poly: Point[]) => signedArea(poly) > 0;

/** 벽 i 의 바깥쪽 단위 법선 */
export const outwardNormal = (poly: Point[], i: number): Point => {
  const d = wallDirection(poly, i);
  // 시계방향(화면)에서 내부는 진행 방향의 오른쪽(-dy,dx) -> 바깥은 (dy,-dx)
  const n = { x: d.y, y: -d.x };
  return isClockwise(poly) ? n : mul(n, -1);
};

export const polygonBounds = (poly: Point[]) => {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};

/** ray casting. 경계 위의 점은 내부로 간주하지 않을 수 있으므로 overlap 판정에서는 여유(EPS)를 둔다 */
export const pointInPolygon = (p: Point, poly: Point[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    const intersect = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
};

const orient = (a: Point, b: Point, c: Point) => cross(sub(b, a), sub(c, a));

/** 두 선분의 "진짜" 교차 (끝점 접촉·평행 겹침은 제외) */
export const segmentsIntersectStrict = (p1: Point, p2: Point, p3: Point, p4: Point) => {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  return ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));
};

/** 벽 i 의 시작점에서 offset(cm) 만큼 떨어진 점 */
export const pointOnWall = (poly: Point[], i: number, offset: number): Point => {
  const w = wallOf(poly, i);
  return add(w.a, mul(unit(sub(w.b, w.a)), offset));
};

/** 점 p 를 벽 i 에 투영한 offset (0..len 으로 clamp) 과 거리 */
export const projectOnWall = (poly: Point[], i: number, p: Point) => {
  const w = wallOf(poly, i);
  const d = sub(w.b, w.a);
  const len = Math.hypot(d.x, d.y);
  if (len < EPS) return { offset: 0, distance: dist(p, w.a) };
  const t = Math.max(0, Math.min(len, dot(sub(p, w.a), d) / len));
  const q = add(w.a, mul(d, t / len));
  return { offset: t, distance: dist(p, q) };
};

export const nearestWall = (poly: Point[], p: Point) => {
  let best = { index: 0, offset: 0, distance: Infinity };
  for (let i = 0; i < poly.length; i++) {
    const r = projectOnWall(poly, i, p);
    if (r.distance < best.distance) best = { index: i, ...r };
  }
  return best;
};

export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export const centroid = (poly: Point[]): Point => {
  const b = polygonBounds(poly);
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
};
