import { describe, expect, it } from "vitest";
import { computeCellRects, expandByQty, paginate, textBaselinePdfY, toPdfRect, validateSheetSpec } from "@/lib/pdf/layout";
import { SHEET_PRESETS } from "@/config/sheetPresets";
import { A4, PT_PER_MM } from "@/lib/units";

const spec3x7 = SHEET_PRESETS.find((s) => s.id === "grid-3x7")!;

describe("computeCellRects", () => {
  it("3x7 은 21칸, 행 우선 순서", () => {
    const cells = computeCellRects(spec3x7);
    expect(cells).toHaveLength(21);
    expect(cells[0]).toMatchObject({ index: 0, row: 0, col: 0, x: spec3x7.marginLeft, y: spec3x7.marginTop });
    expect(cells[1].col).toBe(1);
    expect(cells[3].row).toBe(1);
  });
  it("gap 과 margin 이 반영된다", () => {
    const cells = computeCellRects(spec3x7);
    expect(cells[1].x).toBeCloseTo(spec3x7.marginLeft + spec3x7.labelWidth + spec3x7.gapX);
    expect(cells[3].y).toBeCloseTo(spec3x7.marginTop + spec3x7.labelHeight + spec3x7.gapY);
  });
  it("여백 보정이 모든 칸에 더해진다", () => {
    const a = computeCellRects(spec3x7);
    const b = computeCellRects(spec3x7, { dx: 1.5, dy: -0.5 });
    expect(b[5].x - a[5].x).toBeCloseTo(1.5);
    expect(b[5].y - a[5].y).toBeCloseTo(-0.5);
  });
  it("내장 프리셋은 모두 A4 안에 들어간다", () => {
    for (const s of SHEET_PRESETS) expect(validateSheetSpec(s)).toEqual([]);
  });
  it("A4 를 넘는 규격은 경고", () => {
    expect(validateSheetSpec({ ...spec3x7, cols: 4 }).length).toBeGreaterThan(0);
  });
});

describe("paginate", () => {
  it("시작 칸부터 채우고 다음 페이지는 0부터", () => {
    const { placements, pages, nextStartIndex } = paginate(25, 5, 21);
    expect(pages).toBe(2);
    expect(placements[0]).toEqual({ page: 0, cell: 5, itemIndex: 0 });
    expect(placements[15]).toEqual({ page: 0, cell: 20, itemIndex: 15 });
    expect(placements[16]).toEqual({ page: 1, cell: 0, itemIndex: 16 });
    expect(nextStartIndex).toBe((5 + 25) % 21);
  });
  it("0장이면 0페이지", () => {
    expect(paginate(0, 3, 21).pages).toBe(0);
  });
  it("딱 맞게 끝나면 다음 시작은 0", () => {
    expect(paginate(16, 5, 21).nextStartIndex).toBe(0);
  });
});

describe("expandByQty", () => {
  it("수량만큼 반복", () => {
    expect(expandByQty([{ id: "a", qty: 2 }, { id: "b", qty: 1 }]).map((x) => x.id)).toEqual(["a", "a", "b"]);
  });
});

describe("pdf 좌표 변환", () => {
  it("좌상단 mm -> 좌하단 pt", () => {
    const r = toPdfRect(10, 20, 50, 30);
    expect(r.x).toBeCloseTo(10 * PT_PER_MM);
    expect(r.y).toBeCloseTo((A4.heightMm - 20 - 30) * PT_PER_MM);
    expect(r.width).toBeCloseTo(50 * PT_PER_MM);
  });
  it("기준선은 줄 상자 안쪽에 있다", () => {
    const top = 20;
    const lineH = 6;
    const y = textBaselinePdfY(top, lineH, 12);
    const yTop = (A4.heightMm - top) * PT_PER_MM;
    const yBottom = (A4.heightMm - top - lineH) * PT_PER_MM;
    expect(y).toBeLessThan(yTop);
    expect(y).toBeGreaterThan(yBottom);
  });
});
