"use client";

import { useState } from "react";
import type { SheetSpec } from "@/lib/types";
import { validateSheetSpec, computeCellRects } from "@/lib/pdf/layout";
import { A4 } from "@/lib/units";

type Draft = Omit<SheetSpec, "id" | "builtin" | "pageSize">;

const FIELDS: { key: keyof Draft; label: string; step?: number }[] = [
  { key: "cols", label: "열 수", step: 1 },
  { key: "rows", label: "행 수", step: 1 },
  { key: "labelWidth", label: "라벨 폭 (mm)", step: 0.1 },
  { key: "labelHeight", label: "라벨 높이 (mm)", step: 0.1 },
  { key: "marginLeft", label: "왼쪽 여백 (mm)", step: 0.1 },
  { key: "marginTop", label: "위 여백 (mm)", step: 0.1 },
  { key: "gapX", label: "가로 간격 (mm)", step: 0.1 },
  { key: "gapY", label: "세로 간격 (mm)", step: 0.1 },
];

interface Props {
  initial?: SheetSpec;
  onSubmit: (draft: Draft) => void;
  onCancel: () => void;
}

export function SheetSpecForm({ initial, onSubmit, onCancel }: Props) {
  const [d, setD] = useState<Draft>(
    initial
      ? { name: initial.name, cols: initial.cols, rows: initial.rows, labelWidth: initial.labelWidth, labelHeight: initial.labelHeight, marginTop: initial.marginTop, marginLeft: initial.marginLeft, gapX: initial.gapX, gapY: initial.gapY }
      : { name: "", cols: 3, rows: 7, labelWidth: 63.5, labelHeight: 38.1, marginTop: 15.1, marginLeft: 7.2, gapX: 2.5, gapY: 0 },
  );
  const spec: SheetSpec = { ...d, id: "draft", pageSize: "A4" };
  const issues = validateSheetSpec(spec);
  const S = 0.9;
  const cells = computeCellRects(spec);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">규격 이름</span>
        <input className="input" value={d.name} placeholder="예: 폼텍 3108 (측정값)" onChange={(e) => setD({ ...d, name: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="label">{f.label}</span>
            <input
              className="input"
              type="number"
              step={f.step}
              min={0}
              value={d[f.key] as number}
              onChange={(e) => setD({ ...d, [f.key]: f.step === 1 ? Math.max(1, Math.round(Number(e.target.value))) : Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <div className="flex gap-4 items-start">
        <div className="relative bg-white border border-neutral-300 shrink-0" style={{ width: A4.widthMm * S, height: A4.heightMm * S }}>
          {cells.map((c) => (
            <div key={c.index} className="absolute border border-neutral-400 bg-neutral-50" style={{ left: c.x * S, top: c.y * S, width: c.w * S, height: c.h * S }} />
          ))}
        </div>
        <div className="text-xs text-neutral-600 space-y-1">
          <div>칸 수: {d.cols * d.rows}</div>
          <div>가로 합계: {(d.marginLeft + d.cols * d.labelWidth + (d.cols - 1) * d.gapX).toFixed(1)} / 210 mm</div>
          <div>세로 합계: {(d.marginTop + d.rows * d.labelHeight + (d.rows - 1) * d.gapY).toFixed(1)} / 297 mm</div>
          {issues.map((i) => (
            <div key={i} className="text-red-600">
              ⚠ {i}
            </div>
          ))}
          <p className="text-neutral-500 pt-2">실제 라벨지를 자로 재서 입력한 뒤, 테스트 인쇄로 맞춰 보세요. 미세한 오차는 인쇄 화면의 여백 보정으로 잡습니다.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={onCancel}>
          취소
        </button>
        <button className="btn btn-primary" disabled={!d.name.trim() || issues.length > 0} onClick={() => onSubmit({ ...d, name: d.name.trim() })}>
          저장
        </button>
      </div>
    </div>
  );
}
