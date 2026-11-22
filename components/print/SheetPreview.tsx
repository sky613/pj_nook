"use client";

import type { Calibration, SheetSpec } from "@/lib/types";
import { A4 } from "@/lib/units";
import { computeCellRects, type Placement } from "@/lib/pdf/layout";
import { LabelPreview } from "@/components/labels/LabelPreview";
import type { LabelLayoutInput } from "@/lib/labels/layout";

interface Props {
  spec: SheetSpec;
  calibration: Calibration;
  page: number;
  placements: Placement[];
  inputs: Omit<LabelLayoutInput, "width" | "height">[]; // expanded 순서
  startIndex: number;
  pxPerMm?: number;
  onCellClick?: (cellIndex: number) => void;
}

/** A4 라벨지 한 장 미리보기: 칸 격자 위에 라벨 배치 */
export function SheetPreview({ spec, calibration, page, placements, inputs, startIndex, pxPerMm = 2.2, onCellClick }: Props) {
  const S = pxPerMm;
  const cells = computeCellRects(spec, calibration);
  const byCell = new Map(placements.filter((p) => p.page === page).map((p) => [p.cell, p.itemIndex]));

  return (
    <div className="relative bg-white shadow-md border border-neutral-300 mx-auto select-none" style={{ width: A4.widthMm * S, height: A4.heightMm * S }}>
      {cells.map((c) => {
        const itemIndex = byCell.get(c.index);
        const skipped = page === 0 && c.index < startIndex;
        const clickable = !!onCellClick && page === 0;
        return (
          <div
            key={c.index}
            className={`absolute ${clickable ? "cursor-pointer hover:ring-2 hover:ring-blue-400" : ""}`}
            style={{ left: c.x * S, top: c.y * S, width: c.w * S, height: c.h * S }}
            onClick={() => clickable && onCellClick(c.index)}
            title={clickable ? `${c.index + 1}번 칸부터 시작` : undefined}
          >
            {itemIndex !== undefined ? (
              <LabelPreview input={{ ...inputs[itemIndex], width: c.w, height: c.h }} pxPerMm={S} showBorder />
            ) : (
              <div
                className={`w-full h-full rounded-sm border border-dashed ${skipped ? "border-neutral-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#e5e7eb_4px,#e5e7eb_6px)]" : "border-neutral-200"}`}
              >
                <span className="text-[9px] text-neutral-400 pl-1">{c.index + 1}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
