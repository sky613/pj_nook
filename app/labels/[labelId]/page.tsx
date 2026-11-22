"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LabelPreview } from "@/components/labels/LabelPreview";
import { PresetPicker } from "@/components/labels/PresetPicker";
import { toLayoutInput, useQrBaseUrl, useResolvedLabel } from "@/lib/labels/resolve";
import { useLabelStore } from "@/store/labelStore";
import { useAllSheetSpecs, useSettingsStore } from "@/store/settingsStore";
import { useEditorUi } from "@/store/editorUiStore";

export default function LabelEditPage() {
  const { labelId } = useParams<{ labelId: string }>();
  const router = useRouter();
  const r = useResolvedLabel(labelId);
  const update = useLabelStore((s) => s.updateLabel);
  const remove = useLabelStore((s) => s.deleteLabel);
  const specs = useAllSheetSpecs();
  const defaultSpecId = useSettingsStore((s) => s.defaultSheetSpecId);
  const setDefaultSpec = useSettingsStore((s) => s.setDefaultSheetSpecId);
  const spec = specs.find((s) => s.id === defaultSpecId) ?? specs[0];
  const qrBase = useQrBaseUrl();
  const setHighlight = useEditorUi((s) => s.setHighlight);
  const [warnings, setWarnings] = useState<string[]>([]);
  const onLayout = useCallback((_fits: boolean, w: string[]) => setWarnings((prev) => (prev.join("\n") === w.join("\n") ? prev : w)), []);
  const input = useMemo(() => (r ? toLayoutInput(r, spec, qrBase) : null), [r, spec, qrBase]);

  if (!r) {
    return (
      <div>
        <PageHeader title="라벨" back="/labels" />
        <div className="p-6 text-neutral-500">라벨을 찾을 수 없습니다.</div>
      </div>
    );
  }
  const l = r.label;
  const style = l.style;
  const loc = l.compartmentId ? r.location : null;

  return (
    <div>
      <PageHeader title="라벨 디자인" back="/labels" />
      <div className="p-4 max-w-3xl mx-auto grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="card space-y-3">
            <div className="flex items-center justify-center bg-neutral-100 rounded-md p-4 overflow-auto">
              {input && <LabelPreview input={input} pxPerMm={Math.min(5, 420 / spec.labelWidth)} onLayout={onLayout} />}
            </div>
            {warnings.length > 0 && <div className="text-xs text-red-600">⚠ {warnings.join(" / ")}</div>}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>미리보기 규격</span>
              <select className="input w-auto py-1" value={spec.id} onChange={(e) => setDefaultSpec(e.target.value)}>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="card space-y-3">
            <h2 className="font-medium text-sm">프리셋</h2>
            <PresetPicker value={style.preset} onChange={(preset) => update(l.id, { style: { ...style, preset } })} />
          </section>

          <section className="card space-y-3">
            <h2 className="font-medium text-sm">문구</h2>
            <label className="block">
              <span className="label">라벨 문구 {l.compartmentId && <span className="text-neutral-400">(비우면 칸 이름 사용)</span>}</span>
              <input
                className="input"
                value={l.customText ?? ""}
                placeholder={l.compartmentId ? r.text : "문구 입력"}
                onChange={(e) => update(l.id, { customText: e.target.value })}
              />
            </label>
            {l.compartmentId && (
              <div className="text-xs text-neutral-500 space-y-1">
                <div>연결된 칸: {loc ?? r.location ?? "(위치 표기 꺼짐)"}</div>
                <div>물건: {r.items.join(", ") || "없음"}</div>
                <Link
                  href="/find"
                  className="text-blue-600 hover:underline"
                  onClick={() => setHighlight(null, l.compartmentId)}
                >
                  칸 내용 수정하러 가기 →
                </Link>
              </div>
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="font-medium text-sm">옵션</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={style.showLocation} disabled={!l.compartmentId} onChange={(e) => update(l.id, { style: { ...style, showLocation: e.target.checked } })} />
              위치 표기 (예: 거실 &gt; TV장 &gt; 2번 서랍)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={style.showQR} disabled={!l.compartmentId} onChange={(e) => update(l.id, { style: { ...style, showQR: e.target.checked } })} />
              QR 코드 (칸 상세 페이지로 연결)
            </label>
            {!l.compartmentId && <p className="text-xs text-neutral-500">빠른 라벨은 칸이 없어 위치·QR 을 사용할 수 없습니다.</p>}
          </section>
        </div>

        <aside className="space-y-3">
          <section className="card space-y-3">
            <label className="block">
              <span className="label">수량</span>
              <input className="input" type="number" min={1} max={99} value={l.qty} onChange={(e) => update(l.id, { qty: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={l.selected} onChange={(e) => update(l.id, { selected: e.target.checked })} />
              출력 대상에 포함
            </label>
            {r.needsReprint && <div className="badge bg-amber-100 text-amber-800">재출력 필요 · 출력 후 내용이 바뀜</div>}
            {l.printedAt && <div className="text-xs text-neutral-500">마지막 출력: {new Date(l.printedAt).toLocaleString("ko-KR")}</div>}
          </section>
          <Link href="/labels/print" className="btn btn-primary w-full">
            인쇄 미리보기
          </Link>
          <button
            className="btn btn-danger w-full"
            onClick={() => {
              if (confirm("라벨을 삭제할까요?")) {
                remove(l.id);
                router.push("/labels");
              }
            }}
          >
            라벨 삭제
          </button>
        </aside>
      </div>
    </div>
  );
}
