"use client";

import type { LabelPreset } from "@/lib/types";
import { LABEL_PRESET_LIST } from "@/config/labelPresets";

export function PresetPicker({ value, onChange }: { value: LabelPreset; onChange: (p: LabelPreset) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LABEL_PRESET_LIST.map((p) => (
        <button
          key={p.preset}
          type="button"
          onClick={() => onChange(p.preset)}
          className={`rounded-lg border p-2 text-left ${value === p.preset ? "border-blue-600 bg-blue-50 ring-1 ring-blue-300" : "border-neutral-200 hover:border-neutral-400"}`}
        >
          <div className="text-sm font-medium">{p.label}</div>
          <div className="text-[11px] text-neutral-500 leading-tight">{p.description}</div>
        </button>
      ))}
    </div>
  );
}
