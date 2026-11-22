/**
 * 라벨지 칸 배치 계산 (순수 함수). 단위 mm, 원점 좌상단.
 * pdf-lib 좌표(원점 좌하단, pt) 변환도 여기서만 처리한다.
 */
import type { Calibration, SheetSpec } from "@/lib/types";
import { A4, PT_PER_MM } from "@/lib/units";

export interface CellRect {
  index: number; // 0-based, 행 우선
  row: number;
  col: number;
  x: number; // mm
  y: number; // mm
  w: number;
  h: number;
}

export const cellsPerPage = (spec: Pick<SheetSpec, "cols" | "rows">) => spec.cols * spec.rows;

/** 한 페이지의 모든 칸 사각형 (여백 보정 포함) */
export function computeCellRects(spec: SheetSpec, calibration: Calibration = { dx: 0, dy: 0 }): CellRect[] {
  const out: CellRect[] = [];
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      out.push({
        index: r * spec.cols + c,
        row: r,
        col: c,
        x: spec.marginLeft + calibration.dx + c * (spec.labelWidth + spec.gapX),
        y: spec.marginTop + calibration.dy + r * (spec.labelHeight + spec.gapY),
        w: spec.labelWidth,
        h: spec.labelHeight,
      });
    }
  }
  return out;
}

/** 규격이 A4 를 벗어나는지 등 검증 */
export function validateSheetSpec(spec: SheetSpec): string[] {
  const issues: string[] = [];
  const totalW = spec.marginLeft + spec.cols * spec.labelWidth + (spec.cols - 1) * spec.gapX;
  const totalH = spec.marginTop + spec.rows * spec.labelHeight + (spec.rows - 1) * spec.gapY;
  if (totalW > A4.widthMm + 0.01) issues.push(`가로 합계 ${totalW.toFixed(1)}mm 가 A4 폭 ${A4.widthMm}mm 를 넘습니다.`);
  if (totalH > A4.heightMm + 0.01) issues.push(`세로 합계 ${totalH.toFixed(1)}mm 가 A4 높이 ${A4.heightMm}mm 를 넘습니다.`);
  if (spec.labelWidth < 10 || spec.labelHeight < 5) issues.push("라벨 크기가 너무 작습니다.");
  return issues;
}

/** 수량만큼 펼치기 */
export function expandByQty<T extends { qty: number }>(items: T[]): T[] {
  const out: T[] = [];
  for (const it of items) for (let i = 0; i < Math.max(1, it.qty); i++) out.push(it);
  return out;
}

export interface Placement {
  page: number; // 0-based
  cell: number; // 0-based within page
  itemIndex: number; // expanded 배열 인덱스
}

/**
 * startIndex(첫 페이지에서 건너뛸 칸 수) 부터 순서대로 채운다.
 * 다음 페이지부터는 0번 칸부터.
 */
export function paginate(count: number, startIndex: number, perPage: number): { placements: Placement[]; pages: number; nextStartIndex: number } {
  const placements: Placement[] = [];
  if (perPage <= 0) return { placements, pages: 0, nextStartIndex: 0 };
  const start = ((startIndex % perPage) + perPage) % perPage;
  for (let i = 0; i < count; i++) {
    const abs = start + i;
    placements.push({ page: Math.floor(abs / perPage), cell: abs % perPage, itemIndex: i });
  }
  const pages = count === 0 ? 0 : Math.floor((start + count - 1) / perPage) + 1;
  const nextStartIndex = (start + count) % perPage;
  return { placements, pages, nextStartIndex };
}

/** mm(좌상단 원점) -> pt(pdf-lib 좌하단 원점). 사각형의 좌하단 좌표를 돌려준다 */
export function toPdfRect(xMm: number, yMm: number, wMm: number, hMm: number, pageHeightMm = A4.heightMm) {
  return {
    x: xMm * PT_PER_MM,
    y: (pageHeightMm - yMm - hMm) * PT_PER_MM,
    width: wMm * PT_PER_MM,
    height: hMm * PT_PER_MM,
  };
}

/** 글자 기준선: 줄 상자 상단 mm + 글자 크기 -> pdf y(pt) */
export function textBaselinePdfY(topMm: number, lineHeightMm: number, sizePt: number, pageHeightMm = A4.heightMm) {
  const sizeMm = sizePt / PT_PER_MM;
  // 줄 상자 안에서 세로 중앙 (ascender≈0.88, descender≈0.22)
  const baselineFromTop = (lineHeightMm - sizeMm * 1.1) / 2 + sizeMm * 0.88;
  return (pageHeightMm - topMm - baselineFromTop) * PT_PER_MM;
}
