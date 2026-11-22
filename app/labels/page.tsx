"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { LabelCard } from "@/components/labels/LabelCard";
import { CompartmentPicker } from "@/components/labels/CompartmentPicker";
import { useResolvedLabels, useQrBaseUrl } from "@/lib/labels/resolve";
import { useLabelStore } from "@/store/labelStore";
import { useAllSheetSpecs, useSettingsStore } from "@/store/settingsStore";

export default function LabelsPage() {
  const resolved = useResolvedLabels();
  const setSelected = useLabelStore((s) => s.setSelected);
  const remove = useLabelStore((s) => s.deleteLabel);
  const specs = useAllSheetSpecs();
  const defaultSpecId = useSettingsStore((s) => s.defaultSheetSpecId);
  const spec = specs.find((s) => s.id === defaultSpecId) ?? specs[0];
  const qrBase = useQrBaseUrl();
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState<"all" | "selected" | "reprint">("all");

  const list = useMemo(() => {
    if (filter === "selected") return resolved.filter((r) => r.label.selected);
    if (filter === "reprint") return resolved.filter((r) => r.needsReprint);
    return resolved;
  }, [resolved, filter]);
  const selectedCount = resolved.filter((r) => r.label.selected).reduce((n, r) => n + r.label.qty, 0);
  const reprintCount = resolved.filter((r) => r.needsReprint).length;
  const allIds = resolved.map((r) => r.label.id);

  return (
    <div>
      <PageHeader
        title="라벨"
        actions={
          <Link href="/labels/print" className={`btn btn-primary text-xs ${selectedCount === 0 ? "pointer-events-none opacity-50" : ""}`}>
            인쇄 미리보기 ({selectedCount}장)
          </Link>
        }
      />
      <div className="p-4 max-w-3xl mx-auto space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn" onClick={() => setPicker(true)}>
            + 칸에서 추가
          </button>
          <Link href="/labels/quick" className="btn">
            ⚡ 빠른 라벨
          </Link>
          <span className="flex-1" />
          <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">전체 ({resolved.length})</option>
            <option value="selected">출력 대상</option>
            <option value="reprint">재출력 필요 ({reprintCount})</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <button className="btn text-xs" onClick={() => setSelected(allIds, true)}>
            전체 선택
          </button>
          <button className="btn text-xs" onClick={() => setSelected(allIds, false)}>
            전체 해제
          </button>
          {reprintCount > 0 && (
            <button className="btn text-xs" onClick={() => setSelected(resolved.filter((r) => r.needsReprint).map((r) => r.label.id), true)}>
              재출력 필요만 선택
            </button>
          )}
          <button
            className="btn btn-danger text-xs"
            onClick={() => {
              const ids = resolved.filter((r) => r.label.selected).map((r) => r.label.id);
              if (ids.length && confirm(`선택한 라벨 ${ids.length}개를 삭제할까요?`)) ids.forEach(remove);
            }}
          >
            선택 삭제
          </button>
          <span className="text-neutral-500 ml-auto">미리보기 규격: {spec?.name}</span>
        </div>

        {list.length === 0 && (
          <div className="card text-sm text-neutral-500 text-center py-10">
            라벨이 없습니다. 칸에서 추가하거나 빠른 라벨을 만들어 보세요.
          </div>
        )}
        <ul className="space-y-2">
          {spec && list.map((r) => <LabelCard key={r.label.id} r={r} spec={spec} qrBase={qrBase} />)}
        </ul>
      </div>
      {picker && <CompartmentPicker onClose={() => setPicker(false)} />}
    </div>
  );
}
