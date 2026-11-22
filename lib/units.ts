/** 단위 변환. 데이터: cm(공간) / mm(라벨지). 출력: pt(PDF) / px(화면). */

export const MM_PER_CM = 10;
export const PT_PER_INCH = 72;
export const MM_PER_INCH = 25.4;
export const PT_PER_MM = PT_PER_INCH / MM_PER_INCH;

export const A4 = { widthMm: 210, heightMm: 297 } as const;

export const cmToMm = (cm: number) => cm * MM_PER_CM;
export const mmToCm = (mm: number) => mm / MM_PER_CM;
export const mmToPt = (mm: number) => mm * PT_PER_MM;
export const ptToMm = (pt: number) => pt / PT_PER_MM;

/** 캔버스 스케일: 1cm 당 px */
export const cmToPx = (cm: number, pxPerCm: number) => cm * pxPerCm;
export const pxToCm = (px: number, pxPerCm: number) => px / pxPerCm;

export const round = (v: number, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

export const snap = (v: number, step: number) => Math.round(v / step) * step;
