import type { SheetSpec } from "@/lib/types";

/**
 * 라벨지 규격 프리셋 (단위 mm). 실제 브랜드 규격은 측정값을 여기에 추가한다.
 * 모든 값은 A4(210x297) 기준. marginTop/marginLeft 는 첫 칸의 좌상단 위치.
 */
export const SHEET_PRESETS: SheetSpec[] = [
  {
    id: "grid-3x7",
    name: "3x7 (63.5 x 38.1mm)",
    pageSize: "A4",
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    marginTop: 15.1,
    marginLeft: 7.2,
    gapX: 2.5,
    gapY: 0,
    builtin: true,
  },
  {
    id: "grid-2x5",
    name: "2x5 (99.1 x 57.3mm)",
    pageSize: "A4",
    cols: 2,
    rows: 5,
    labelWidth: 99.1,
    labelHeight: 57.3,
    marginTop: 4.5,
    marginLeft: 4.7,
    gapX: 2.5,
    gapY: 0,
    builtin: true,
  },
  {
    id: "grid-4x10",
    name: "4x10 (48.3 x 25.4mm)",
    pageSize: "A4",
    cols: 4,
    rows: 10,
    labelWidth: 48.3,
    labelHeight: 25.4,
    marginTop: 21.5,
    marginLeft: 8.0,
    gapX: 0,
    gapY: 0,
    builtin: true,
  },
  {
    id: "grid-2x4",
    name: "2x4 (99.1 x 67.7mm)",
    pageSize: "A4",
    cols: 2,
    rows: 4,
    labelWidth: 99.1,
    labelHeight: 67.7,
    marginTop: 13.1,
    marginLeft: 4.7,
    gapX: 2.5,
    gapY: 0,
    builtin: true,
  },
];

export const DEFAULT_SHEET_PRESET_ID = SHEET_PRESETS[0].id;
