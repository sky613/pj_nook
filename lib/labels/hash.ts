import type { LabelStyle } from "@/lib/types";

/** 출력 내용 결정 요소. 하나라도 바뀌면 "재출력 필요" */
export interface LabelContent {
  text: string;
  location: string | null;
  items: string[];
  icon?: string;
  color?: string;
  style: LabelStyle;
}

/** 결정적 문자열 -> 32bit FNV-1a 해시 (hex) */
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function labelContentHash(c: LabelContent): string {
  const payload = JSON.stringify([
    c.text,
    c.location ?? "",
    [...c.items],
    c.icon ?? "",
    c.color ?? "",
    c.style.preset,
    c.style.showLocation,
    c.style.showQR,
  ]);
  return fnv1a(payload);
}
