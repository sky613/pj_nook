"use client";

const cache = new Map<string, Promise<ArrayBuffer>>();

export const FONT_FILES = {
  regular: "/fonts/NotoSansKR-Regular.otf",
  bold: "/fonts/NotoSansKR-Bold.otf",
} as const;

export function loadFontBytes(kind: keyof typeof FONT_FILES): Promise<ArrayBuffer> {
  const url = FONT_FILES[kind];
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`폰트를 불러오지 못했습니다: ${url}`);
        return r.arrayBuffer();
      }),
    );
  }
  return cache.get(url)!;
}
