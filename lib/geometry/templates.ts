import type { Point } from "@/lib/types";

export type RoomTemplate = "rect" | "l" | "u";

export const ROOM_TEMPLATES: { id: RoomTemplate; label: string }[] = [
  { id: "rect", label: "사각형" },
  { id: "l", label: "ㄱ자" },
  { id: "u", label: "ㄷ자" },
];

/** 템플릿 폴리곤 (cm). 시계방향, 좌상단 원점 */
export function templatePolygon(t: RoomTemplate, w = 400, h = 300): Point[] {
  switch (t) {
    case "rect":
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    case "l": {
      const cw = Math.round(w * 0.5 / 10) * 10;
      const ch = Math.round(h * 0.5 / 10) * 10;
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: ch },
        { x: cw, y: ch },
        { x: cw, y: h },
        { x: 0, y: h },
      ];
    }
    case "u": {
      const nw = Math.round(w * 0.3 / 10) * 10; // 양쪽 날개 폭
      const nd = Math.round(h * 0.4 / 10) * 10; // 파인 깊이
      return [
        { x: 0, y: 0 },
        { x: nw, y: 0 },
        { x: nw, y: nd },
        { x: w - nw, y: nd },
        { x: w - nw, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }
  }
}
