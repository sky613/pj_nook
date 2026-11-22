"use client";

import { useEffect, useState } from "react";
import type { Compartment } from "@/lib/types";
import { useHomeStore } from "@/store/homeStore";
import { useLabelStore } from "@/store/labelStore";
import { COMPARTMENT_COLORS } from "@/config/labelPresets";
import { TagInput } from "@/components/ui/TagInput";

const ICONS = ["", "🧦", "👕", "👖", "🧥", "📚", "📦", "🔌", "💊", "🧴", "🍚", "🥛", "🧊", "🧸", "✏️", "🧰"];

export function CompartmentForm({ compartment, onClose }: { compartment: Compartment; onClose?: () => void }) {
  const update = useHomeStore((s) => s.updateCompartment);
  const labels = useLabelStore((s) => s.labels);
  const addLabel = useLabelStore((s) => s.addLabelForCompartment);
  const [name, setName] = useState(compartment.name);
  useEffect(() => setName(compartment.name), [compartment.id, compartment.name]);
  const labelCount = Object.values(labels).filter((l) => l.compartmentId === compartment.id).length;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">칸 이름 (라벨 문구)</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== compartment.name && update(compartment.id, { name: name.trim() })}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </label>
      <div>
        <span className="label">물건 목록</span>
        <TagInput value={compartment.items} onChange={(items) => update(compartment.id, { items })} />
      </div>
      <div>
        <span className="label">색상</span>
        <div className="flex flex-wrap gap-1.5">
          {COMPARTMENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full border-2 ${compartment.color === c ? "border-blue-600" : "border-neutral-200"}`}
              style={{ background: c }}
              onClick={() => update(compartment.id, { color: c })}
              aria-label={`색상 ${c}`}
            />
          ))}
        </div>
      </div>
      <div>
        <span className="label">아이콘 (아이용 라벨)</span>
        <div className="flex flex-wrap gap-1">
          {ICONS.map((ic) => (
            <button
              key={ic || "none"}
              type="button"
              className={`w-8 h-8 rounded-md border text-lg ${(compartment.icon ?? "") === ic ? "border-blue-600 bg-blue-50" : "border-neutral-200"}`}
              onClick={() => update(compartment.id, { icon: ic || undefined })}
            >
              {ic || "—"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button className="btn btn-primary" onClick={() => addLabel(compartment.id)}>
          🏷️ 라벨 추가
        </button>
        <span className="text-xs text-neutral-500">라벨 {labelCount}개</span>
        <span className="flex-1" />
        {onClose && (
          <button className="btn" onClick={onClose}>
            닫기
          </button>
        )}
      </div>
    </div>
  );
}
