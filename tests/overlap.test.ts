import { describe, expect, it } from "vitest";
import { computeWarnings, furnitureRect, rectInsidePolygon, rectsOverlap } from "@/lib/geometry/overlap";
import { templatePolygon } from "@/lib/geometry/templates";
import type { Furniture } from "@/lib/types";

const base: Furniture = { id: "a", roomId: "r", type: "drawer", name: "a", x: 0, y: 0, width: 80, depth: 40, rotation: 0, rows: 1, cols: 1 };

describe("furnitureRect", () => {
  it("90도 회전 시 폭/깊이가 바뀐다", () => {
    expect(furnitureRect({ ...base, rotation: 90 })).toEqual({ x: 0, y: 0, w: 40, h: 80 });
    expect(furnitureRect(base)).toEqual({ x: 0, y: 0, w: 80, h: 40 });
  });
});

describe("rectsOverlap", () => {
  it("변이 맞닿은 경우는 겹침이 아니다", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 80, h: 40 }, { x: 80, y: 0, w: 80, h: 40 })).toBe(false);
    expect(rectsOverlap({ x: 0, y: 0, w: 80, h: 40 }, { x: 70, y: 0, w: 80, h: 40 })).toBe(true);
  });
});

describe("rectInsidePolygon", () => {
  const rect = templatePolygon("rect", 400, 300);
  const l = templatePolygon("l", 400, 300); // 우하단(200..400, 150..300) 파임
  it("벽에 딱 붙은 가구는 내부", () => {
    expect(rectInsidePolygon({ x: 0, y: 0, w: 80, h: 40 }, rect)).toBe(true);
    expect(rectInsidePolygon({ x: 320, y: 260, w: 80, h: 40 }, rect)).toBe(true);
  });
  it("벽 밖으로 나가면 외부", () => {
    expect(rectInsidePolygon({ x: 350, y: 0, w: 80, h: 40 }, rect)).toBe(false);
    expect(rectInsidePolygon({ x: -10, y: 0, w: 80, h: 40 }, rect)).toBe(false);
  });
  it("ㄱ자 오목 모서리를 가로지르면 외부 (네 모서리가 모두 내부여도)", () => {
    // 가로 190..410? -> 안쪽: x 150..250, y 100..200 : 모서리 (250,200) 은 파인 영역
    expect(rectInsidePolygon({ x: 150, y: 100, w: 100, h: 100 }, l)).toBe(false);
    // 모서리는 모두 내부지만 변이 오목 꼭짓점(200,150)을 가로지르는 경우
    expect(rectInsidePolygon({ x: 150, y: 120, w: 100, h: 20 }, l)).toBe(true);
    expect(rectInsidePolygon({ x: 100, y: 0, w: 200, h: 100 }, l)).toBe(true);
  });
});

describe("computeWarnings", () => {
  it("겹침과 벽 침범을 동시에 보고한다", () => {
    const poly = templatePolygon("rect", 400, 300);
    const list: Furniture[] = [base, { ...base, id: "b", x: 40, y: 0 }, { ...base, id: "c", x: 380, y: 0 }];
    const w = computeWarnings(list, poly);
    expect(w.a.overlaps).toEqual(["b"]);
    expect(w.b.overlaps).toEqual(["a"]);
    expect(w.c.outside).toBe(true);
    expect(w.a.outside).toBe(false);
  });
});
