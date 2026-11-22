"use client";

import Link from "next/link";
import type { ResolvedLabel } from "@/lib/labels/text";
import { LABEL_PRESETS } from "@/config/labelPresets";
import { useLabelStore } from "@/store/labelStore";
import { LabelPreview } from "./LabelPreview";
import { toLayoutInput } from "@/lib/labels/resolve";
import type { SheetSpec } from "@/lib/types";

interface Props {
  r: ResolvedLabel;
  spec: SheetSpec;
  qrBase: string;
}

export function LabelCard({ r, spec, qrBase }: Props) {
  const update = useLabelStore((s) => s.updateLabel);
  const remove = useLabelStore((s) => s.deleteLabel);
  const l = r.label;
  const pxPerMm = Math.min(2.2, 140 / spec.labelWidth);

  return (
    <li className={`card flex gap-3 items-start ${l.selected ? "" : "opacity-60"}`}>
      <input type="checkbox" className="mt-1 w-4 h-4" checked={l.selected} onChange={(e) => update(l.id, { selected: e.target.checked })} aria-label="출력 대상" />
      <Link href={`/labels/${l.id}`} className="shrink-0">
        <LabelPreview input={toLayoutInput(r, spec, qrBase)} pxPerMm={pxPerMm} />
      </Link>
      <div className="flex-1 min-w-0 text-sm">
        <Link href={`/labels/${l.id}`} className="font-medium hover:underline truncate block">
          {r.text}
        </Link>
        <div className="text-xs text-neutral-500 truncate">{r.location ?? (l.compartmentId ? "위치 숨김" : "빠른 라벨")}</div>
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <span className="badge bg-neutral-100 text-neutral-600">{LABEL_PRESETS[l.style.preset].label}</span>
          {l.style.showQR && <span className="badge bg-neutral-100 text-neutral-600">QR</span>}
          {r.needsReprint && <span className="badge bg-amber-100 text-amber-800">재출력 필요</span>}
          {r.orphan && <span className="badge bg-red-100 text-red-700">칸 삭제됨</span>}
          {l.printedAt && !r.needsReprint && <span className="badge bg-green-100 text-green-700">출력됨</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden">
          <button className="px-2 py-0.5 hover:bg-neutral-100" onClick={() => update(l.id, { qty: Math.max(1, l.qty - 1) })} aria-label="수량 감소">
            −
          </button>
          <span className="px-2 text-sm tabular-nums w-8 text-center">{l.qty}</span>
          <button className="px-2 py-0.5 hover:bg-neutral-100" onClick={() => update(l.id, { qty: Math.min(99, l.qty + 1) })} aria-label="수량 증가">
            +
          </button>
        </div>
        <button className="text-xs text-red-600 hover:underline" onClick={() => confirm("라벨을 삭제할까요?") && remove(l.id)}>
          삭제
        </button>
      </div>
    </li>
  );
}
