"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { downloadJson, exportDocument, importDocument } from "@/store/document";
import { loadSampleData } from "@/store/hydration";
import { useAllSheetSpecs, useSettingsStore } from "@/store/settingsStore";
import { SheetSpecForm } from "@/components/print/SheetSpecForm";
import type { SheetSpec } from "@/lib/types";

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const specs = useAllSheetSpecs();
  const s = useSettingsStore();
  const [editing, setEditing] = useState<SheetSpec | "new" | null>(null);

  const onExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`nook-${date}.json`, exportDocument());
  };
  const onImportFile = async (file: File) => {
    try {
      const doc = importDocument(await file.text());
      setMsg(`가져오기 완료: 방 ${doc.rooms.length}개, 칸 ${doc.compartments.length}개, 라벨 ${doc.labels.length}개`);
    } catch (e) {
      setMsg(`가져오기 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div>
      <PageHeader title="설정" />
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">라벨지 규격</h2>
            <button className="btn text-xs" onClick={() => setEditing("new")}>
              + 사용자 정의 규격
            </button>
          </div>
          <ul className="divide-y divide-neutral-100">
            {specs.map((sp) => (
              <li key={sp.id} className="flex items-center gap-3 py-2 text-sm">
                <input type="radio" name="defaultSpec" checked={s.defaultSheetSpecId === sp.id} onChange={() => s.setDefaultSheetSpecId(sp.id)} aria-label="기본 규격" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {sp.name} {sp.builtin && <span className="badge bg-neutral-100 text-neutral-500 ml-1">내장</span>}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {sp.cols}×{sp.rows} · {sp.labelWidth}×{sp.labelHeight}mm · 여백 L{sp.marginLeft} T{sp.marginTop} · 간격 {sp.gapX}/{sp.gapY}
                  </div>
                </div>
                {!sp.builtin && (
                  <>
                    <button className="btn text-xs" onClick={() => setEditing(sp)}>
                      수정
                    </button>
                    <button className="btn btn-danger text-xs" onClick={() => confirm("규격을 삭제할까요?") && s.deleteCustomSheetSpec(sp.id)}>
                      삭제
                    </button>
                  </>
                )}
                {sp.builtin && (
                  <button className="btn text-xs" onClick={() => setEditing({ ...sp, id: "", builtin: false, name: `${sp.name} (복사)` })}>
                    복사
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="border-t border-neutral-200 pt-3">
              <h3 className="text-sm font-medium mb-2">{editing === "new" || !editing.id ? "새 규격" : "규격 수정"}</h3>
              <SheetSpecForm
                initial={editing === "new" ? undefined : editing}
                onCancel={() => setEditing(null)}
                onSubmit={(draft) => {
                  if (editing !== "new" && editing.id) s.updateCustomSheetSpec(editing.id, draft);
                  else {
                    const created = s.addCustomSheetSpec({ ...draft, pageSize: "A4" });
                    s.setDefaultSheetSpecId(created.id);
                  }
                  setEditing(null);
                }}
              />
            </div>
          )}
          <p className="text-xs text-neutral-500">내장 프리셋은 일반적인 격자 예시입니다. 실제 제품은 자로 측정해 사용자 정의 규격으로 추가하세요 (config/sheetPresets.ts 에 코드로 추가할 수도 있습니다).</p>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium">인쇄 보정</h2>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <label className="block">
              <span className="label">가로 보정 dx (mm)</span>
              <input className="input" type="number" step={0.1} value={s.calibration.dx} onChange={(e) => s.setCalibration({ ...s.calibration, dx: Number(e.target.value) || 0 })} />
            </label>
            <label className="block">
              <span className="label">세로 보정 dy (mm)</span>
              <input className="input" type="number" step={0.1} value={s.calibration.dy} onChange={(e) => s.setCalibration({ ...s.calibration, dy: Number(e.target.value) || 0 })} />
            </label>
          </div>
          <label className="block max-w-md">
            <span className="label">QR 기본 주소 (비우면 현재 주소 사용)</span>
            <input className="input" placeholder="https://example.com" value={s.qrBaseUrl} onChange={(e) => s.setQrBaseUrl(e.target.value)} />
            <span className="text-xs text-neutral-500">QR 은 {`{주소}/c/{칸ID}`} 로 연결됩니다. 데이터가 이 브라우저에만 있으므로 다른 기기에서 열면 JSON 가져오기가 필요합니다.</span>
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium">데이터</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={onExport}>
              JSON 내보내기
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              JSON 가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = "";
              }}
            />
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm("현재 데이터를 모두 지우고 샘플 원룸으로 되돌릴까요?")) {
                  loadSampleData();
                  setMsg("샘플 데이터를 불러왔습니다.");
                }
              }}
            >
              샘플 데이터로 초기화
            </button>
          </div>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
          <p className="text-xs text-neutral-500">데이터는 이 브라우저의 localStorage 에만 저장됩니다. 다른 기기로 옮기려면 JSON 으로 내보내세요.</p>
        </section>
      </div>
    </div>
  );
}
