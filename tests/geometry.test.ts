import { describe, expect, it } from "vitest";
import {
  nearestWall,
  outwardNormal,
  pointInPolygon,
  polygonArea,
  segmentsIntersectStrict,
  wallLength,
} from "@/lib/geometry/polygon";
import { clampOpenings, insertVertex, moveVertex, remapOpeningsAfterInsert, setWallLength } from "@/lib/geometry/wall";
import { templatePolygon } from "@/lib/geometry/templates";
import { snapPoint } from "@/lib/geometry/snap";

const rect = templatePolygon("rect", 400, 300);

describe("polygon basics", () => {
  it("면적과 벽 길이", () => {
    expect(polygonArea(rect)).toBe(120000);
    expect(wallLength(rect, 0)).toBe(400);
    expect(wallLength(rect, 1)).toBe(300);
  });
  it("바깥 법선은 윗벽에서 위(-y)", () => {
    const n = outwardNormal(rect, 0);
    expect(n.x).toBeCloseTo(0);
    expect(n.y).toBeCloseTo(-1);
  });
  it("ㄱ자 방의 파인 부분은 외부", () => {
    const l = templatePolygon("l", 400, 300);
    expect(pointInPolygon({ x: 100, y: 100 }, l)).toBe(true);
    expect(pointInPolygon({ x: 350, y: 250 }, l)).toBe(false);
  });
  it("선분 교차 (접촉은 제외)", () => {
    expect(segmentsIntersectStrict({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
    expect(segmentsIntersectStrict({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 })).toBe(false);
  });
  it("가장 가까운 벽", () => {
    const r = nearestWall(rect, { x: 200, y: 5 });
    expect(r.index).toBe(0);
    expect(r.offset).toBe(200);
    expect(r.distance).toBe(5);
  });
});

describe("setWallLength", () => {
  it("윗벽 길이를 바꾸면 아랫벽도 따라 늘어난다 (직각 유지)", () => {
    const next = setWallLength(rect, 0, 500);
    expect(wallLength(next, 0)).toBe(500);
    expect(wallLength(next, 2)).toBe(500);
    expect(wallLength(next, 1)).toBe(300);
    expect(next[1]).toEqual({ x: 500, y: 0 });
    expect(next[2]).toEqual({ x: 500, y: 300 });
  });
  it("ㄷ자 방의 날개 벽을 줄여도 다각형이 유지된다", () => {
    const u = templatePolygon("u", 400, 300);
    const next = setWallLength(u, 1, 60); // 왼쪽 날개 안쪽 벽 (아래로 내려가는 벽)
    expect(wallLength(next, 1)).toBe(60);
    expect(next.length).toBe(u.length);
  });
});

describe("moveVertex", () => {
  it("직각 유지 모드에서 이웃 꼭짓점이 따라온다", () => {
    const next = moveVertex(rect, 1, { x: 450, y: -20 });
    expect(next[1]).toEqual({ x: 450, y: -20 });
    expect(next[0].y).toBe(-20); // 윗벽 수평 유지
    expect(next[2].x).toBe(450); // 오른벽 수직 유지
  });
  it("자유 이동은 이웃을 건드리지 않는다", () => {
    const next = moveVertex(rect, 1, { x: 450, y: -20 }, false);
    expect(next[0]).toEqual(rect[0]);
    expect(next[2]).toEqual(rect[2]);
  });
});

describe("openings", () => {
  it("벽이 짧아지면 offset 이 clamp 된다", () => {
    const o = [{ id: "d", type: "door" as const, wallIndex: 0, offset: 350, width: 90 }];
    const poly = setWallLength(rect, 0, 300);
    expect(clampOpenings(poly, o)[0].offset).toBe(210);
  });
  it("꼭짓점 삽입 후 뒤쪽 개구부는 다음 벽으로 이동", () => {
    const o = [{ id: "d", type: "door" as const, wallIndex: 0, offset: 300, width: 90 }];
    const next = insertVertex(rect, 0, { x: 200, y: 0 });
    const r = remapOpeningsAfterInsert(rect, next, o, 0);
    expect(r[0].wallIndex).toBe(1);
    expect(r[0].offset).toBe(100);
  });
});

describe("snap", () => {
  it("10cm 격자", () => {
    expect(snapPoint({ x: 14, y: 26 })).toEqual({ x: 10, y: 30 });
  });
});
