/**
 * 라벨 한 장 내부 배치 (순수 함수). 모든 길이는 mm, 글자 크기는 pt.
 * 화면 미리보기와 PDF 렌더러가 같은 결과를 사용한다.
 */
import type { LabelPreset } from "@/lib/types";
import { LABEL_PRESETS } from "@/config/labelPresets";
import { PT_PER_MM } from "@/lib/units";

export const ptToMm = (pt: number) => pt / PT_PER_MM;

/** 글자 폭 측정기: (문자열, 글자크기 pt, 굵게) -> 폭 mm */
export type TextMeasurer = (text: string, sizePt: number, bold: boolean) => number;

export interface LabelLayoutInput {
  width: number; // mm
  height: number; // mm
  text: string;
  location: string | null;
  items: string[];
  icon?: string;
  preset: LabelPreset;
  showQR: boolean;
  qrData?: string | null;
}

export type LabelElement =
  | { type: "text"; x: number; y: number; w: number; h: number; size: number; text: string; bold: boolean; align: "left" | "center"; color: string }
  | { type: "qr"; x: number; y: number; size: number; data: string }
  | { type: "icon"; x: number; y: number; size: number; emoji: string }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; width: number }
  | { type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number; fill?: string };

export interface LabelLayout {
  elements: LabelElement[];
  titleSize: number; // pt
  fits: boolean; // 최소 글자 크기에서도 넘치면 false
  warnings: string[];
}

const LINE = 1.2; // line-height 배수

/** 한 줄 안에 들어가는 최대 글자 크기 (max..min). 못 들어가면 min 과 fits=false */
export function fitFontSize(text: string, boxWidthMm: number, boxHeightMm: number, max: number, min: number, measure: TextMeasurer, bold: boolean) {
  const byHeight = boxHeightMm / (ptToMm(1) * LINE); // 높이로 가능한 최대 pt
  let size = Math.min(max, byHeight);
  if (size < min) return { size: min, fits: false };
  // 0.5pt 단위로 축소
  for (let s = Math.floor(size * 2) / 2; s >= min; s -= 0.5) {
    if (measure(text, s, bold) <= boxWidthMm) return { size: s, fits: true };
  }
  return { size: min, fits: false };
}

/** 폭에 맞춰 말줄임 */
export function ellipsize(text: string, sizePt: number, widthMm: number, measure: TextMeasurer, bold: boolean): string {
  if (measure(text, sizePt, bold) <= widthMm) return text;
  let t = text;
  while (t.length > 1 && measure(t + "…", sizePt, bold) > widthMm) t = t.slice(0, -1);
  return t + "…";
}

export function computeLabelLayout(input: LabelLayoutInput, measure: TextMeasurer): LabelLayout {
  const { width: W, height: H } = input;
  const def = LABEL_PRESETS[input.preset];
  const els: LabelElement[] = [];
  const warnings: string[] = [];
  const pad = Math.max(1.5, Math.min(3, Math.min(W, H) * 0.07));
  const innerH = H - pad * 2;
  let left = pad;
  let right = W - pad;

  // 아이콘 (아이용)
  if (def.showIcon && input.icon) {
    const size = Math.min(innerH, W * 0.28);
    els.push({ type: "icon", x: left, y: pad + (innerH - size) / 2, size, emoji: input.icon });
    left += size + pad * 0.8;
  }
  // QR (오른쪽)
  if (input.showQR && input.qrData) {
    const size = Math.min(innerH, W * 0.3);
    els.push({ type: "qr", x: right - size, y: pad + (innerH - size) / 2, size, data: input.qrData });
    right -= size + pad * 0.8;
  }
  const cw = Math.max(1, right - left);

  // 부가 줄 구성
  const subLines: { text: string; size: number; color: string }[] = [];
  if (input.location) subLines.push({ text: input.location, size: 0, color: "#6b7280" });
  if (def.showItems && input.items.length) subLines.push({ text: input.items.join(", "), size: 0, color: "#374151" });
  const dateLine = def.showDateField;

  // 높이 배분: 날짜칸 고정, 부가 줄은 제목의 45% 크기 (최소 5pt, 최대 8pt)
  const dateH = dateLine ? Math.min(6, innerH * 0.28) : 0;
  let avail = innerH - dateH;
  const subRatio = 0.45;

  // 제목 글자 크기: 폭 + 높이(부가 줄 포함)로 맞춤
  const subCount = subLines.length;
  const heightForTitle = (titlePt: number) => {
    const sub = Math.min(8, Math.max(5, titlePt * subRatio));
    return ptToMm(titlePt) * LINE + subCount * ptToMm(sub) * LINE;
  };
  // 높이 제약을 만족하는 최대 제목 크기 (이분 탐색 대신 0.5 단위 감소)
  let maxByHeight = def.fontMax;
  while (maxByHeight > def.fontMin && heightForTitle(maxByHeight) > avail) maxByHeight -= 0.5;
  const fitted = fitFontSize(input.text, cw, avail, maxByHeight, def.fontMin, measure, def.bold);
  const titleSize = fitted.size;
  const fits = fitted.fits && heightForTitle(titleSize) <= avail + 0.01;
  if (!fits) warnings.push(`"${input.text}" 문구가 칸보다 깁니다 (최소 ${def.fontMin}pt 에서도 넘침)`);
  const subSize = Math.min(8, Math.max(5, titleSize * subRatio));

  // 세로 중앙 정렬
  const blockH = ptToMm(titleSize) * LINE + subCount * ptToMm(subSize) * LINE;
  let y = pad + Math.max(0, (avail - blockH) / 2);
  const align: "left" | "center" = def.showIcon && input.icon ? "left" : "center";

  els.push({
    type: "text",
    x: left,
    y,
    w: cw,
    h: ptToMm(titleSize) * LINE,
    size: titleSize,
    text: fits ? input.text : ellipsize(input.text, titleSize, cw, measure, def.bold),
    bold: def.bold,
    align,
    color: "#111827",
  });
  y += ptToMm(titleSize) * LINE;
  for (const s of subLines) {
    els.push({
      type: "text",
      x: left,
      y,
      w: cw,
      h: ptToMm(subSize) * LINE,
      size: subSize,
      text: ellipsize(s.text, subSize, cw, measure, false),
      bold: false,
      align,
      color: s.color,
    });
    y += ptToMm(subSize) * LINE;
  }
  avail = innerH - dateH;

  // 냉장고용 날짜 기입란
  if (dateLine) {
    const dy = H - pad - dateH;
    const fs = Math.min(7, Math.max(5, subSize));
    const labelText = "날짜:";
    const lw = measure(labelText, fs, false);
    els.push({ type: "line", x1: left, y1: dy, x2: right, y2: dy, color: "#d1d5db", width: 0.2 });
    els.push({ type: "text", x: left, y: dy + (dateH - ptToMm(fs) * LINE) / 2, w: lw + 1, h: ptToMm(fs) * LINE, size: fs, text: labelText, bold: false, align: "left", color: "#6b7280" });
    const bx = left + lw + 2;
    const by = dy + dateH * 0.2;
    els.push({ type: "rect", x: bx, y: by, w: Math.max(5, right - bx), h: dateH * 0.6, color: "#9ca3af", width: 0.2 });
  }

  return { elements: els, titleSize, fits, warnings };
}

/** 테스트/폴백용 근사 측정기: 한글 1em, 영숫자 0.55em */
export const approxMeasurer: TextMeasurer = (text, sizePt, bold) => {
  let em = 0;
  for (const ch of text) em += /[ㄱ-힝]/.test(ch) ? 1 : /[A-Z]/.test(ch) ? 0.65 : 0.55;
  return em * ptToMm(sizePt) * (bold ? 1.05 : 1);
};
