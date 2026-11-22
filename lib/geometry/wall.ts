import type { Opening, Point } from "@/lib/types";
import { EPS, add, dist, dot, mul, sub, unit, wallLength } from "./polygon";

const isPerpendicular = (u: Point, v: Point) => Math.abs(dot(u, v)) < 1e-3;

/**
 * 벽 i 의 길이를 newLen 으로 변경. 끝 꼭짓점을 벽 방향으로 밀고,
 * 다음 벽이 직각이면 그 끝점도 함께 밀어 직각(평행)을 유지한다.
 */
export function setWallLength(poly: Point[], i: number, newLen: number): Point[] {
  const n = poly.length;
  const a = poly[i];
  const j = (i + 1) % n;
  const k = (i + 2) % n;
  const cur = dist(a, poly[j]);
  if (cur < EPS || newLen <= 0) return poly;
  const d = unit(sub(poly[j], a));
  const delta = mul(d, newLen - cur);
  const next = poly.map((p) => ({ ...p }));
  next[j] = add(poly[j], delta);
  if (n > 3 && k !== i) {
    const nd = unit(sub(poly[k], poly[j]));
    if (isPerpendicular(d, nd)) next[k] = add(poly[k], delta);
  }
  return next;
}

/**
 * 꼭짓점 idx 를 p 로 이동. keepOrtho 이면 인접 벽이 축 정렬일 때 이웃 꼭짓점을 따라 움직여
 * 직각을 유지한다 (사각형/ㄱ자/ㄷ자 유지).
 */
export function moveVertex(poly: Point[], idx: number, p: Point, keepOrtho = true): Point[] {
  const n = poly.length;
  const next = poly.map((q) => ({ ...q }));
  const old = poly[idx];
  next[idx] = { ...p };
  if (!keepOrtho) return next;
  const prevI = (idx - 1 + n) % n;
  const nextI = (idx + 1) % n;
  for (const ni of [prevI, nextI]) {
    const nb = poly[ni];
    const horizontal = Math.abs(nb.y - old.y) < 1e-3 && Math.abs(nb.x - old.x) > 1e-3;
    const vertical = Math.abs(nb.x - old.x) < 1e-3 && Math.abs(nb.y - old.y) > 1e-3;
    if (horizontal) next[ni] = { x: nb.x, y: p.y };
    else if (vertical) next[ni] = { x: p.x, y: nb.y };
  }
  return next;
}

export function insertVertex(poly: Point[], wallIndex: number, p: Point): Point[] {
  const next = poly.map((q) => ({ ...q }));
  next.splice(wallIndex + 1, 0, { ...p });
  return next;
}

export function removeVertex(poly: Point[], idx: number): Point[] {
  if (poly.length <= 3) return poly;
  return poly.filter((_, i) => i !== idx);
}

/** 벽 길이 범위를 벗어난 개구부 offset/width 보정 */
export function clampOpenings(poly: Point[], openings: Opening[]): Opening[] {
  return openings
    .filter((o) => o.wallIndex < poly.length)
    .map((o) => {
      const len = wallLength(poly, o.wallIndex);
      const width = Math.min(o.width, len);
      const offset = Math.max(0, Math.min(len - width, o.offset));
      return { ...o, width, offset };
    });
}

/** 꼭짓점 삽입 후 개구부 wallIndex/offset 재배치 */
export function remapOpeningsAfterInsert(poly: Point[], newPoly: Point[], openings: Opening[], wallIndex: number): Opening[] {
  const firstLen = wallLength(newPoly, wallIndex);
  return clampOpenings(
    newPoly,
    openings.map((o) => {
      if (o.wallIndex > wallIndex) return { ...o, wallIndex: o.wallIndex + 1 };
      if (o.wallIndex === wallIndex && o.offset >= firstLen) {
        return { ...o, wallIndex: wallIndex + 1, offset: o.offset - firstLen };
      }
      return o;
    }),
  );
}

/** 꼭짓점 제거 후 개구부 재배치 (벽 idx-1 과 idx 가 하나로 합쳐짐) */
export function remapOpeningsAfterRemove(poly: Point[], newPoly: Point[], openings: Opening[], idx: number): Opening[] {
  const n = poly.length;
  const prev = (idx - 1 + n) % n;
  const prevLen = wallLength(poly, prev);
  return clampOpenings(
    newPoly,
    openings.map((o) => {
      if (o.wallIndex === idx) return { ...o, wallIndex: prev, offset: o.offset + prevLen };
      if (o.wallIndex > idx) return { ...o, wallIndex: o.wallIndex - 1 };
      return o;
    }),
  ).map((o) => ({ ...o, wallIndex: o.wallIndex % newPoly.length }));
}
