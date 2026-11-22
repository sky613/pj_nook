"use client";

import type { Furniture, Rotation } from "@/lib/types";
import { FURNITURE_TYPES } from "@/config/furnitureTypes";
import type { FurnitureWarning } from "@/lib/geometry/overlap";
import { useHomeStore } from "@/store/homeStore";
import { useEditorUi } from "@/store/editorUiStore";
import { deleteFurnitureCascade } from "@/store/actions";
import { snapValue } from "@/lib/geometry/snap";

interface Props {
  furniture: Furniture;
  warning?: FurnitureWarning;
  furnitureNames: Record<string, string>;
}

function Num({ label, value, onCommit, min = 10 }: { label: string; value: number; onCommit: (v: number) => void; min?: number }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type="number"
        step={10}
        min={min}
        defaultValue={Math.round(value)}
        key={value}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= min) onCommit(snapValue(v));
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

export const rotateCw = (r: Rotation): Rotation => (((r + 90) % 360) as Rotation);

export function FurniturePanel({ furniture: f, warning, furnitureNames }: Props) {
  const update = useHomeStore((s) => s.updateFurniture);
  const openFrontView = useEditorUi((s) => s.openFrontView);
  const select = useEditorUi((s) => s.select);
  const def = FURNITURE_TYPES[f.type];

  return (
    <div className="space-y-3">
      <div>
        <span className="label">{def.label}</span>
        <input className="input font-medium" value={f.name} onChange={(e) => update(f.id, { name: e.target.value })} />
      </div>
      {warning && (warning.outside || warning.overlaps.length > 0) && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs p-2 space-y-0.5">
          {warning.outside && <div>⚠ 벽 밖으로 나갔거나 벽을 가로지릅니다.</div>}
          {warning.overlaps.length > 0 && <div>⚠ 겹침: {warning.overlaps.map((id) => furnitureNames[id] ?? id).join(", ")}</div>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Num label="폭 (cm)" value={f.width} onCommit={(v) => update(f.id, { width: v })} />
        <Num label="깊이 (cm)" value={f.depth} onCommit={(v) => update(f.id, { depth: v })} />
        <Num label="X (cm)" value={f.x} min={-10000} onCommit={(v) => update(f.id, { x: v })} />
        <Num label="Y (cm)" value={f.y} min={-10000} onCommit={(v) => update(f.id, { y: v })} />
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => update(f.id, { rotation: rotateCw(f.rotation) })} title="90도 회전 (R)">
          ⟳ 회전 {f.rotation}°
        </button>
        <span className="text-xs text-neutral-500">굵은 선이 정면</span>
      </div>
      <button className="btn btn-primary w-full" onClick={() => openFrontView(f.id)}>
        정면도 · 칸 나누기 ({f.rows}×{f.cols})
      </button>
      <p className="text-xs text-neutral-500">가구를 더블클릭해도 정면도가 열립니다. 드래그로 이동, 모서리 핸들로 크기 조절.</p>
      <button
        className="btn btn-danger w-full"
        onClick={() => {
          if (confirm(`"${f.name}"과 칸·라벨을 삭제할까요?`)) {
            deleteFurnitureCascade(f.id);
            select({ kind: "none" });
          }
        }}
      >
        가구 삭제
      </button>
    </div>
  );
}
