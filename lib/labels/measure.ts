"use client";

import type { TextMeasurer } from "./layout";
import { approxMeasurer } from "./layout";

const FONT_STACK = '"Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", Pretendard, system-ui, sans-serif';
let ctx: CanvasRenderingContext2D | null = null;

/** 브라우저 canvas 로 글자 폭 측정 (화면 미리보기용 근사치). PDF 는 실제 폰트 메트릭을 사용 */
export const canvasMeasurer: TextMeasurer = (text, sizePt, bold) => {
  if (typeof document === "undefined") return approxMeasurer(text, sizePt, bold);
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return approxMeasurer(text, sizePt, bold);
  ctx.font = `${bold ? 700 : 400} ${sizePt}pt ${FONT_STACK}`;
  const px = ctx.measureText(text).width; // 96dpi 기준 px
  return (px * 25.4) / 96;
};
