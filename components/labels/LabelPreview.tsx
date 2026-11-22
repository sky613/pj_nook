"use client";

import { useEffect, useMemo, useState } from "react";
import type { LabelLayoutInput } from "@/lib/labels/layout";
import { computeLabelLayout } from "@/lib/labels/layout";
import { canvasMeasurer } from "@/lib/labels/measure";
import { qrDataUrl } from "@/lib/labels/qr";
import { PT_PER_MM } from "@/lib/units";

interface Props {
  input: LabelLayoutInput;
  /** px per mm */
  pxPerMm?: number;
  className?: string;
  showBorder?: boolean;
  onLayout?: (fits: boolean, warnings: string[]) => void;
}

/** 라벨 1장 HTML 미리보기. 배치는 PDF 와 동일한 computeLabelLayout 결과 사용 */
export function LabelPreview({ input, pxPerMm = 4, className = "", showBorder = true, onLayout }: Props) {
  const layout = useMemo(() => computeLabelLayout(input, canvasMeasurer), [input]);
  const [qr, setQr] = useState<string | null>(null);
  const qrEl = layout.elements.find((e) => e.type === "qr");
  const qrData = qrEl?.type === "qr" ? qrEl.data : null;

  useEffect(() => {
    let alive = true;
    if (qrData) qrDataUrl(qrData, 256).then((u) => alive && setQr(u));
    else setQr(null);
    return () => {
      alive = false;
    };
  }, [qrData]);

  const warnKey = layout.warnings.join("\n");
  useEffect(() => {
    onLayout?.(layout.fits, warnKey ? warnKey.split("\n") : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.fits, warnKey, onLayout]);

  const S = pxPerMm;
  const ptPx = (pt: number) => (pt / PT_PER_MM) * S; // pt -> mm -> px

  return (
    <div
      className={`relative font-label bg-white overflow-hidden ${showBorder ? "border border-dashed border-neutral-300" : ""} ${!layout.fits ? "outline outline-2 outline-red-400" : ""} ${className}`}
      style={{ width: input.width * S, height: input.height * S, borderRadius: 2 * S }}
      title={layout.warnings.join("\n") || undefined}
    >
      {layout.elements.map((e, i) => {
        switch (e.type) {
          case "text":
            return (
              <div
                key={i}
                className="absolute whitespace-nowrap overflow-hidden leading-[1.2]"
                style={{
                  left: e.x * S,
                  top: e.y * S,
                  width: e.w * S,
                  height: e.h * S,
                  fontSize: ptPx(e.size),
                  fontWeight: e.bold ? 700 : 400,
                  textAlign: e.align,
                  color: e.color,
                }}
              >
                {e.text}
              </div>
            );
          case "qr":
            return qr ? (
              <img key={i} src={qr} alt="QR" className="absolute" style={{ left: e.x * S, top: e.y * S, width: e.size * S, height: e.size * S }} />
            ) : (
              <div key={i} className="absolute bg-neutral-200" style={{ left: e.x * S, top: e.y * S, width: e.size * S, height: e.size * S }} />
            );
          case "icon":
            return (
              <div key={i} className="absolute flex items-center justify-center" style={{ left: e.x * S, top: e.y * S, width: e.size * S, height: e.size * S, fontSize: e.size * S * 0.8, lineHeight: 1 }}>
                {e.emoji}
              </div>
            );
          case "line":
            return <div key={i} className="absolute" style={{ left: e.x1 * S, top: e.y1 * S, width: (e.x2 - e.x1) * S, height: Math.max(1, e.width * S), background: e.color }} />;
          case "rect":
            return <div key={i} className="absolute border" style={{ left: e.x * S, top: e.y * S, width: e.w * S, height: e.h * S, borderColor: e.color, borderWidth: Math.max(1, e.width * S), background: e.fill }} />;
        }
      })}
    </div>
  );
}
