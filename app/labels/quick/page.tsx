"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PresetPicker } from "@/components/labels/PresetPicker";
import { LabelPreview } from "@/components/labels/LabelPreview";
import { defaultLabelStyle } from "@/config/labelPresets";
import type { LabelPreset } from "@/lib/types";
import { useLabelStore } from "@/store/labelStore";
import { useAllSheetSpecs, useSettingsStore } from "@/store/settingsStore";

/** 도면 없이 문구만으로 라벨을 바로 만드는 경로 */
export default function QuickLabelPage() {
  const router = useRouter();
  const addQuick = useLabelStore((s) => s.addQuickLabel);
  const specs = useAllSheetSpecs();
  const defaultSpecId = useSettingsStore((s) => s.defaultSheetSpecId);
  const spec = specs.find((s) => s.id === defaultSpecId) ?? specs[0];
  const [text, setText] = useState("");
  const [preset, setPreset] = useState<LabelPreset>("minimal");
  const [qty, setQty] = useState(1);

  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const create = () => {
    if (!lines.length) return;
    const style = { ...defaultLabelStyle(preset), showLocation: false, showQR: false };
    lines.forEach((t) => {
      const l = addQuick(t, style);
      if (qty > 1) useLabelStore.getState().updateLabel(l.id, { qty });
    });
    router.push("/labels");
  };

  return (
    <div>
      <PageHeader title="빠른 라벨" back="/labels" />
      <div className="p-4 max-w-xl mx-auto space-y-4">
        <section className="card space-y-3">
          <label className="block">
            <span className="label">라벨 문구 (여러 줄 입력 시 줄마다 한 장)</span>
            <textarea className="input min-h-28" value={text} onChange={(e) => setText(e.target.value)} placeholder={"양말\n충전기\n여름 이불"} />
          </label>
          <PresetPicker value={preset} onChange={setPreset} />
          <label className="block">
            <span className="label">장당 수량</span>
            <input className="input w-24" type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          </label>
        </section>
        {lines.length > 0 && (
          <section className="card">
            <div className="label">미리보기 ({spec.name})</div>
            <div className="flex flex-wrap gap-2">
              {lines.slice(0, 6).map((t, i) => (
                <LabelPreview key={i} input={{ width: spec.labelWidth, height: spec.labelHeight, text: t, location: null, items: [], preset, showQR: false }} pxPerMm={Math.min(3, 200 / spec.labelWidth)} />
              ))}
            </div>
          </section>
        )}
        <button className="btn btn-primary w-full" disabled={!lines.length} onClick={create}>
          라벨 {lines.length}종 만들기
        </button>
      </div>
    </div>
  );
}
