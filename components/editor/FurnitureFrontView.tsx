"use client";

import { useEffect, useState } from "react";
import { useHomeStore } from "@/store/homeStore";
import { compartmentsOf } from "@/store/selectors";
import { setFurnitureGridCascade } from "@/store/actions";
import { FURNITURE_TYPES } from "@/config/furnitureTypes";
import { CompartmentForm } from "./CompartmentForm";

interface Props {
  furnitureId: string;
  onClose: () => void;
  initialCompartmentId?: string | null;
}

/** 가구 정면도: 행·열 격자로 칸을 나누고, 칸을 클릭해 편집 */
export function FurnitureFrontView({ furnitureId, onClose, initialCompartmentId }: Props) {
  const data = useHomeStore();
  const f = data.furniture[furnitureId];
  const comps = f ? compartmentsOf(data, furnitureId) : [];
  const [activeId, setActiveId] = useState<string | null>(initialCompartmentId ?? null);
  const [rows, setRows] = useState(f?.rows ?? 1);
  const [cols, setCols] = useState(f?.cols ?? 1);

  useEffect(() => {
    if (f) {
      setRows(f.rows);
      setCols(f.cols);
    }
  }, [f?.rows, f?.cols, f]);

  useEffect(() => {
    if (initialCompartmentId) setActiveId(initialCompartmentId);
  }, [initialCompartmentId]);

  if (!f) return null;
  const active = activeId ? data.compartments[activeId] : null;
  const applyGrid = (r: number, c: number) => {
    const nr = Math.max(1, Math.min(12, Math.round(r)));
    const nc = Math.max(1, Math.min(12, Math.round(c)));
    setRows(nr);
    setCols(nc);
    if (nr !== f.rows || nc !== f.cols) {
      if (nr * nc < f.rows * f.cols && !confirm("칸이 줄어들면 범위 밖 칸과 라벨이 삭제됩니다. 계속할까요?")) {
        setRows(f.rows);
        setCols(f.cols);
        return;
      }
      setFurnitureGridCascade(f.id, nr, nc);
      setActiveId(null);
    }
  };

  // 정면도 비율: 폭 = width, 높이는 종류별 대략값
  const heightCm = f.type === "fridge" ? 180 : f.type === "wardrobe" ? 200 : f.type === "bookshelf" ? 160 : f.type === "storage_box" ? 30 : 90;
  const aspect = f.width / heightCm;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-black/30" onClick={onClose}>
      <div
        className="bg-white w-full md:w-[480px] max-h-[90vh] md:max-h-none md:h-full rounded-t-2xl md:rounded-none overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 h-12 flex items-center gap-2">
          <span className="text-lg">{FURNITURE_TYPES[f.type].label === f.name ? "" : ""}</span>
          <h2 className="font-semibold flex-1 truncate">
            {f.name} <span className="text-xs font-normal text-neutral-500">정면도 · {FURNITURE_TYPES[f.type].label}</span>
          </h2>
          <button className="btn px-2" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-end gap-3">
            <label className="block">
              <span className="label">행</span>
              <input className="input w-20" type="number" min={1} max={12} value={rows} onChange={(e) => setRows(Number(e.target.value))} onBlur={() => applyGrid(rows, cols)} onKeyDown={(e) => e.key === "Enter" && applyGrid(rows, cols)} />
            </label>
            <label className="block">
              <span className="label">열</span>
              <input className="input w-20" type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Number(e.target.value))} onBlur={() => applyGrid(rows, cols)} onKeyDown={(e) => e.key === "Enter" && applyGrid(rows, cols)} />
            </label>
            <span className="text-xs text-neutral-500 pb-2">칸 {f.rows * f.cols}개</span>
          </div>

          <div
            className="grid gap-1 p-2 rounded-lg border-4 border-neutral-700 bg-neutral-200 mx-auto w-full"
            style={{
              gridTemplateColumns: `repeat(${f.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${f.rows}, minmax(0, 1fr))`,
              aspectRatio: `${Math.max(0.4, Math.min(3, aspect))}`,
              maxHeight: "50vh",
            }}
          >
            {comps.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`relative rounded-md border-2 text-left p-1.5 overflow-hidden flex flex-col min-h-12
                  ${activeId === c.id ? "border-blue-600 ring-2 ring-blue-300" : "border-neutral-400/60 hover:border-neutral-600"}`}
                style={{ background: c.color }}
              >
                <span className="text-xs font-semibold leading-tight truncate">
                  {c.icon && <span className="mr-0.5">{c.icon}</span>}
                  {c.name}
                </span>
                <span className="text-[10px] text-neutral-600 leading-tight line-clamp-2">{c.items.join(", ") || "비어 있음"}</span>
              </button>
            ))}
          </div>

          {active ? (
            <div className="card">
              <div className="text-xs text-neutral-500 mb-2">
                {active.row + 1}행 {active.col + 1}열
              </div>
              <CompartmentForm compartment={active} />
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center">칸을 클릭해 이름·물건·색상을 지정하세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
