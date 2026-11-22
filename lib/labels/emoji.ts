"use client";

/** 이모지를 PNG dataURL 로 렌더 (PDF 임베딩용; 본문 폰트에는 이모지 글리프가 없음) */
export function emojiToPngDataUrl(emoji: string, px = 128): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, px, px);
  ctx.font = `${Math.floor(px * 0.8)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, px / 2, px / 2 + px * 0.04);
  return canvas.toDataURL("image/png");
}
