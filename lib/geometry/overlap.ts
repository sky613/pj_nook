import type { Furniture, Point } from "@/lib/types";
import { pointInPolygon, segmentsIntersectStrict, walls } from "./polygon";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 회전을 반영한 축 정렬 사각형 (회전은 0/90/180/270 만 허용) */
export const furnitureRect = (f: Pick<Furniture, "x" | "y" | "width" | "depth" | "rotation">): Rect => {
  const swap = f.rotation === 90 || f.rotation === 270;
  return { x: f.x, y: f.y, w: swap ? f.depth : f.width, h: swap ? f.width : f.depth };
};

/** 겹침 (모서리/변 접촉은 허용) */
export const rectsOverlap = (a: Rect, b: Rect, eps = 1e-6) =>
  a.x + a.w > b.x + eps && b.x + b.w > a.x + eps && a.y + a.h > b.y + eps && b.y + b.h > a.y + eps;

export const rectCorners = (r: Rect): Point[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.w, y: r.y },
  { x: r.x + r.w, y: r.y + r.h },
  { x: r.x, y: r.y + r.h },
];

/**
 * 사각형이 다각형 내부에 완전히 들어있는지.
 * 모서리를 살짝 안쪽(eps)으로 당겨 벽에 딱 붙은 가구는 통과시키고,
 * 변이 벽을 가로지르는 경우(ㄱ자 오목 모서리)는 교차 검사로 잡는다.
 */
export const rectInsidePolygon = (r: Rect, poly: Point[], eps = 0.01) => {
  const inner: Rect = { x: r.x + eps, y: r.y + eps, w: Math.max(0, r.w - 2 * eps), h: Math.max(0, r.h - 2 * eps) };
  const corners = rectCorners(inner);
  if (!corners.every((c) => pointInPolygon(c, poly))) return false;
  const edges = corners.map((c, i) => [c, corners[(i + 1) % 4]] as const);
  for (const w of walls(poly)) {
    for (const [a, b] of edges) {
      if (segmentsIntersectStrict(a, b, w.a, w.b)) return false;
    }
  }
  return true;
};

export interface FurnitureWarning {
  outside: boolean;
  overlaps: string[]; // 겹치는 가구 id
}

export const computeWarnings = (list: Furniture[], poly: Point[]): Record<string, FurnitureWarning> => {
  const rects = list.map((f) => ({ id: f.id, r: furnitureRect(f) }));
  const out: Record<string, FurnitureWarning> = {};
  for (const { id, r } of rects) {
    const overlaps = rects.filter((o) => o.id !== id && rectsOverlap(r, o.r)).map((o) => o.id);
    out[id] = { outside: !rectInsidePolygon(r, poly), overlaps };
  }
  return out;
};

export const hasWarning = (w?: FurnitureWarning) => !!w && (w.outside || w.overlaps.length > 0);
