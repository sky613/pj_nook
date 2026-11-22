import type { NookDocument } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { defaultLabelStyle } from "@/config/labelPresets";

/** 처음 접속 시 제공하는 "샘플 원룸" */
export function buildSampleDocument(): NookDocument {
  const now = Date.now();
  const roomId = "sample-room";
  const f = {
    drawer: "sample-drawer",
    bookshelf: "sample-bookshelf",
    wardrobe: "sample-wardrobe",
    box: "sample-box",
    fridge: "sample-fridge",
  };
  const comp = (id: string, furnitureId: string, name: string, row: number, col: number, items: string[], color: string, icon?: string) => ({
    id,
    furnitureId,
    name,
    row,
    col,
    items,
    color,
    icon,
    updatedAt: now,
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    home: { id: "sample-home", name: "샘플 집" },
    rooms: [
      {
        id: roomId,
        name: "원룸",
        polygon: [
          { x: 0, y: 0 },
          { x: 450, y: 0 },
          { x: 450, y: 350 },
          { x: 0, y: 350 },
        ],
        openings: [
          { id: "sample-door", type: "door", wallIndex: 3, offset: 240, width: 90 },
          { id: "sample-window", type: "window", wallIndex: 1, offset: 80, width: 150 },
        ],
        createdAt: now,
      },
    ],
    furniture: [
      { id: f.drawer, roomId, type: "drawer", name: "서랍장", x: 10, y: 10, width: 80, depth: 45, rotation: 0, rows: 3, cols: 1 },
      { id: f.bookshelf, roomId, type: "bookshelf", name: "책장", x: 120, y: 10, width: 80, depth: 30, rotation: 0, rows: 3, cols: 2 },
      { id: f.wardrobe, roomId, type: "wardrobe", name: "옷장", x: 10, y: 180, width: 120, depth: 60, rotation: 90, rows: 1, cols: 2 },
      { id: f.box, roomId, type: "storage_box", name: "수납박스", x: 250, y: 10, width: 40, depth: 30, rotation: 0, rows: 1, cols: 1 },
      { id: f.fridge, roomId, type: "fridge", name: "냉장고", x: 350, y: 270, width: 90, depth: 70, rotation: 0, rows: 3, cols: 1 },
    ],
    compartments: [
      comp("sc-d1", f.drawer, "1번 서랍", 0, 0, ["양말", "속옷"], "#fecaca", "🧦"),
      comp("sc-d2", f.drawer, "2번 서랍", 1, 0, ["티셔츠", "반바지"], "#fed7aa", "👕"),
      comp("sc-d3", f.drawer, "3번 서랍", 2, 0, ["충전기", "케이블", "건전지"], "#fef08a", "🔌"),
      comp("sc-b1", f.bookshelf, "1번 칸", 0, 0, ["소설"], "#bae6fd"),
      comp("sc-b2", f.bookshelf, "2번 칸", 0, 1, ["만화책"], "#bae6fd"),
      comp("sc-b3", f.bookshelf, "3번 칸", 1, 0, ["전공서적"], "#c7d2fe"),
      comp("sc-b4", f.bookshelf, "4번 칸", 1, 1, ["노트", "필기구"], "#c7d2fe"),
      comp("sc-b5", f.bookshelf, "5번 칸", 2, 0, ["서류", "영수증"], "#f5d0fe"),
      comp("sc-b6", f.bookshelf, "6번 칸", 2, 1, ["약", "반창고"], "#f5d0fe", "💊"),
      comp("sc-w1", f.wardrobe, "왼쪽 칸", 0, 0, ["외투", "코트"], "#f4f4f5"),
      comp("sc-w2", f.wardrobe, "오른쪽 칸", 0, 1, ["셔츠", "원피스"], "#f4f4f5"),
      comp("sc-x1", f.box, "수납박스", 0, 0, ["계절용품", "장갑", "목도리"], "#bbf7d0", "📦"),
      comp("sc-f1", f.fridge, "냉장 1칸", 0, 0, ["반찬", "김치"], "#bae6fd"),
      comp("sc-f2", f.fridge, "냉장 2칸", 1, 0, ["우유", "계란", "두부"], "#bae6fd"),
      comp("sc-f3", f.fridge, "냉동", 2, 0, ["만두", "아이스크림"], "#c7d2fe", "🧊"),
    ],
    labels: [
      { id: "sl-1", compartmentId: "sc-d1", style: defaultLabelStyle("kids"), qty: 1, selected: true, createdAt: now },
      { id: "sl-2", compartmentId: "sc-d2", style: defaultLabelStyle("kids"), qty: 1, selected: true, createdAt: now },
      { id: "sl-3", compartmentId: "sc-d3", style: defaultLabelStyle("minimal"), qty: 1, selected: true, createdAt: now },
      { id: "sl-4", compartmentId: "sc-f1", style: { ...defaultLabelStyle("fridge"), showQR: true }, qty: 2, selected: true, createdAt: now },
      { id: "sl-5", compartmentId: "sc-f2", style: defaultLabelStyle("fridge"), qty: 1, selected: true, createdAt: now },
      { id: "sl-6", compartmentId: "sc-x1", style: { ...defaultLabelStyle("minimal"), showQR: true }, qty: 1, selected: false, createdAt: now },
    ],
    customSheetSpecs: [],
    settings: { calibration: { dx: 0, dy: 0 }, defaultSheetSpecId: "grid-3x7", lastStartIndex: 0 },
  };
}
