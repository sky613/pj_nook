"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SheetPreview } from "@/components/print/SheetPreview";
import { useQrBaseUrl, useResolvedLabels, toLayoutInput } from "@/lib/labels/resolve";
import { useAllSheetSpecs, useSettingsStore } from "@/store/settingsStore";
import { useLabelStore } from "@/store/labelStore";
import { cellsPerPage, expandByQty, paginate, validateSheetSpec } from "@/lib/pdf/layout";
import { computeLabelLayout } from "@/lib/labels/layout";
import { canvasMeasurer } from "@/lib/labels/measure";
import { downloadBytes, generateLabelsPdf, generateTestSheetPdf, type PrintItem } from "@/lib/pdf/render";

export default function PrintPage() {
  const resolved = useResolvedLabels();
  const specs = useAllSheetSpecs();
  const defaultSpecId = useSettingsStore((s) => s.defaultSheetSpecId);
  const setDefaultSpecId = useSettingsStore((s) => s.setDefaultSheetSpecId);
  const calibration = useSettingsStore((s) => s.calibration);
  const setCalibration = useSettingsStore((s) => s.setCalibration);
  const lastStartIndex = useSettingsStore((s) => s.lastStartIndex);
  const setLastStartIndex = useSettingsStore((s) => s.setLastStartIndex);
  const markPrinted = useLabelStore((s) => s.markPrinted);
  const qrBase = useQrBaseUrl();

  const spec = specs.find((s) => s.id === defaultSpecId) ?? specs[0];
  const perPage = cellsPerPage(spec);
  const [startIndex, setStartIndex] = useState(lastStartIndex % perPage);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<null | "labels" | "test">(null);
  const [pdf, setPdf] = useState<{ url: string; bytes: Uint8Array; kind: "labels" | "test"; pages: number; nextStartIndex: number; warnings: string[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => setStartIndex((s) => s % perPage), [perPage]);
  useEffect(
    () => () => {
      if (pdf) URL.revokeObjectURL(pdf.url);
    },
    [pdf],
  );

  const selected = useMemo(() => resolved.filter((r) => r.label.selected && !r.orphan), [resolved]);
  const items: PrintItem[] = useMemo(
    () =>
      selected.map((r) => {
        const { width: _w, height: _h, ...input } = toLayoutInput(r, spec, qrBase);
        return { id: r.label.id, qty: r.label.qty, input };
      }),
    [selected, spec, qrBase],
  );
  const expanded = useMemo(() => expandByQty(items), [items]);
  const inputs = useMemo(() => expanded.map((e) => e.input), [expanded]);
  const { placements, pages } = useMemo(() => paginate(expanded.length, startIndex, perPage), [expanded.length, startIndex, perPage]);
  const specIssues = validateSheetSpec(spec);

  // 화면 측정 기준 넘침 경고 (PDF 생성 시 실제 폰트로 다시 검사)
  const overflow = useMemo(
    () => items.filter((it) => !computeLabelLayout({ ...it.input, width: spec.labelWidth, height: spec.labelHeight }, canvasMeasurer).fits).map((it) => it.input.text),
    [items, spec.labelWidth, spec.labelHeight],
  );

  const setPdfFromBytes = (bytes: Uint8Array, kind: "labels" | "test", extra: { pages: number; nextStartIndex: number; warnings: string[] }) => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    setPdf({ url, bytes, kind, ...extra });
  };

  const makeLabels = async () => {
    setBusy("labels");
    setMsg(null);
    try {
      const r = await generateLabelsPdf({ spec, calibration, startIndex, items, drawCellBorders: false });
      setPdfFromBytes(r.bytes, "labels", { pages: r.pages, nextStartIndex: r.nextStartIndex, warnings: r.warnings });
    } catch (e) {
      setMsg(`PDF 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const makeTest = async () => {
    setBusy("test");
    setMsg(null);
    try {
      const bytes = await generateTestSheetPdf(spec, calibration);
      setPdfFromBytes(bytes, "test", { pages: 1, nextStartIndex: startIndex, warnings: [] });
    } catch (e) {
      setMsg(`PDF 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const download = () => {
    if (!pdf) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBytes(pdf.bytes, pdf.kind === "test" ? `nook-test-${spec.cols}x${spec.rows}-${date}.pdf` : `nook-labels-${date}.pdf`);
    if (pdf.kind === "labels") {
      markPrinted(selected.map((r) => ({ id: r.label.id, hash: r.hash })));
      setLastStartIndex(pdf.nextStartIndex);
      setMsg(`라벨 ${expanded.length}장을 출력 완료로 표시했습니다. 다음 시작 칸: ${pdf.nextStartIndex + 1}번`);
    }
  };

  const cal = (key: "dx" | "dy", delta: number) => setCalibration({ ...calibration, [key]: Math.round((calibration[key] + delta) * 10) / 10 });

  return (
    <div>
      <PageHeader title="인쇄 미리보기" back="/labels" />
      <div className="p-4 max-w-6xl mx-auto grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <section className="card space-y-3">
            <label className="block">
              <span className="label">라벨지 규격</span>
              <select className="input" value={spec.id} onChange={(e) => setDefaultSpecId(e.target.value)}>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Link href="/settings" className="text-xs text-blue-600 hover:underline">
                규격 관리 →
              </Link>
            </label>
            {specIssues.map((i) => (
              <div key={i} className="text-xs text-red-600">
                ⚠ {i}
              </div>
            ))}
            <label className="block">
              <span className="label">시작 칸 (이미 쓴 칸 건너뛰기)</span>
              <div className="flex items-center gap-2">
                <input className="input w-24" type="number" min={1} max={perPage} value={startIndex + 1} onChange={(e) => setStartIndex(Math.max(0, Math.min(perPage - 1, (Number(e.target.value) || 1) - 1)))} />
                <span className="text-xs text-neutral-500">/ {perPage}칸 · 미리보기 칸을 클릭해도 됩니다</span>
              </div>
            </label>
            <div>
              <span className="label">여백 미세 조정 (mm)</span>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(["dx", "dy"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="w-6 text-neutral-500">{k === "dx" ? "←→" : "↑↓"}</span>
                    <button className="btn px-2" onClick={() => cal(k, -0.5)}>
                      −
                    </button>
                    <span className="w-12 text-center tabular-nums">{calibration[k] > 0 ? "+" : ""}{calibration[k].toFixed(1)}</span>
                    <button className="btn px-2" onClick={() => cal(k, 0.5)}>
                      +
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-1">테스트 인쇄 결과가 오른쪽/아래로 치우치면 음수로 보정하세요.</p>
            </div>
          </section>

          <section className="card space-y-2 text-sm">
            <div className="flex justify-between">
              <span>출력 라벨</span>
              <b>{expanded.length}장</b>
            </div>
            <div className="flex justify-between">
              <span>페이지</span>
              <b>{pages}장</b>
            </div>
            {overflow.length > 0 && (
              <div className="text-xs text-red-600 space-y-0.5">
                <div>⚠ 글자가 칸보다 길어 최소 크기 미만으로 줄어듭니다:</div>
                {overflow.map((t) => (
                  <div key={t} className="truncate">
                    · {t}
                  </div>
                ))}
                <div className="text-neutral-500">문구를 줄이거나 더 큰 라벨지를 선택하세요.</div>
              </div>
            )}
            <button className="btn btn-primary w-full" disabled={busy !== null || expanded.length === 0 || specIssues.length > 0} onClick={makeLabels}>
              {busy === "labels" ? "생성 중…" : "라벨 PDF 만들기"}
            </button>
            <button className="btn w-full" disabled={busy !== null || specIssues.length > 0} onClick={makeTest}>
              {busy === "test" ? "생성 중…" : "테스트 인쇄 PDF (테두리만)"}
            </button>
            {msg && <p className="text-xs text-neutral-600">{msg}</p>}
            <p className="text-xs text-neutral-500">인쇄 시 브라우저/프린터 설정에서 “실제 크기(100%)”, 여백 없음으로 출력하세요.</p>
          </section>

          {pdf && (
            <section className="card space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{pdf.kind === "test" ? "테스트 인쇄" : "라벨"} PDF · {pdf.pages}페이지</span>
                <button className="btn btn-primary text-xs" onClick={download}>
                  다운로드
                </button>
              </div>
              {pdf.warnings.length > 0 && (
                <div className="text-xs text-red-600">
                  {pdf.warnings.map((w) => (
                    <div key={w}>⚠ {w}</div>
                  ))}
                </div>
              )}
              <iframe src={pdf.url} className="w-full h-72 border border-neutral-200 rounded" title="PDF 미리보기" />
            </section>
          )}
        </aside>

        <section className="space-y-2 overflow-x-auto">
          {pages > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} className={`btn text-xs ${page === i ? "btn-primary" : ""}`} onClick={() => setPage(i)}>
                  {i + 1}쪽
                </button>
              ))}
            </div>
          )}
          <SheetPreview
            spec={spec}
            calibration={calibration}
            page={Math.min(page, Math.max(0, pages - 1))}
            placements={placements}
            inputs={inputs}
            startIndex={startIndex}
            pxPerMm={2.4}
            onCellClick={(i) => {
              setStartIndex(i);
              setPage(0);
            }}
          />
          {expanded.length === 0 && <p className="text-center text-sm text-neutral-500">출력 대상으로 선택된 라벨이 없습니다.</p>}
        </section>
      </div>
    </div>
  );
}
