"use client";

import { useMemo, useState } from "react";
import { useHomeStore } from "@/store/homeStore";
import { useLabelStore } from "@/store/labelStore";
import { compartmentsOf, furnitureOf, roomsSorted } from "@/store/selectors";

/** 도면의 칸 목록에서 골라 라벨을 추가하는 모달 */
export function CompartmentPicker({ onClose }: { onClose: () => void }) {
  const data = useHomeStore();
  const labels = useLabelStore((s) => s.labels);
  const addLabel = useLabelStore((s) => s.addLabelForCompartment);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const labeled = useMemo(() => new Set(Object.values(labels).map((l) => l.compartmentId).filter(Boolean)), [labels]);
  const rooms = roomsSorted(data);

  const toggle = (id: string) => {
    const n = new Set(picked);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setPicked(n);
  };
  const addAllUnlabeled = () => {
    const n = new Set(picked);
    Object.values(data.compartments).forEach((c) => !labeled.has(c.id) && n.add(c.id));
    setPicked(n);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg max-h-[85vh] rounded-t-2xl md:rounded-xl flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 h-12 border-b border-neutral-200 flex items-center gap-2">
          <h2 className="font-semibold flex-1">칸에서 라벨 추가</h2>
          <button className="btn text-xs" onClick={addAllUnlabeled}>
            라벨 없는 칸 모두 선택
          </button>
          <button className="btn px-2" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4">
          {rooms.length === 0 && <p className="text-sm text-neutral-500">방이 없습니다. 우리 집 탭에서 방과 가구를 먼저 만들거나, 빠른 라벨을 사용하세요.</p>}
          {rooms.map((room) => (
            <div key={room.id}>
              <div className="font-medium text-sm mb-1">{room.name}</div>
              {furnitureOf(data, room.id).map((f) => (
                <div key={f.id} className="ml-2 mb-2">
                  <div className="text-xs text-neutral-500 mb-1">{f.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {compartmentsOf(data, f.id).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={`badge border ${picked.has(c.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white border-neutral-300 hover:border-neutral-500"}`}
                        title={c.items.join(", ")}
                      >
                        {c.icon} {c.name}
                        {labeled.has(c.id) && <span className="ml-1 opacity-60">·라벨있음</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-neutral-200 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-primary"
            disabled={picked.size === 0}
            onClick={() => {
              picked.forEach((id) => addLabel(id));
              onClose();
            }}
          >
            {picked.size}개 추가
          </button>
        </div>
      </div>
    </div>
  );
}
