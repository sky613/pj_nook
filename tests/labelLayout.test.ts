import { describe, expect, it } from "vitest";
import { approxMeasurer, computeLabelLayout, fitFontSize } from "@/lib/labels/layout";

const base = { width: 63.5, height: 38.1, text: "양말", location: "원룸 > 서랍장 > 1번 서랍", items: ["양말", "속옷"], preset: "minimal" as const, showQR: false };

describe("fitFontSize", () => {
  it("짧은 문구는 최대 크기", () => {
    const r = fitFontSize("양말", 60, 30, 18, 8, approxMeasurer, false);
    expect(r.size).toBe(18);
    expect(r.fits).toBe(true);
  });
  it("긴 문구는 줄어들고, 최소 미만이면 fits=false", () => {
    const r = fitFontSize("아주아주아주아주 긴 라벨 문구입니다", 40, 30, 18, 8, approxMeasurer, false);
    expect(r.size).toBeLessThan(18);
    const r2 = fitFontSize("아주아주아주아주아주아주아주아주아주 긴 라벨 문구", 20, 30, 18, 8, approxMeasurer, false);
    expect(r2.fits).toBe(false);
    expect(r2.size).toBe(8);
  });
  it("높이가 낮으면 높이에 의해 제한된다", () => {
    const r = fitFontSize("A", 60, 4, 18, 8, approxMeasurer, false);
    expect(r.size).toBeLessThan(18);
  });
});

describe("computeLabelLayout", () => {
  it("미니멀: 제목 + 위치 + 물건 3줄, 모두 라벨 안", () => {
    const l = computeLabelLayout(base, approxMeasurer);
    const texts = l.elements.filter((e) => e.type === "text");
    expect(texts).toHaveLength(3);
    expect(l.fits).toBe(true);
    for (const e of l.elements) {
      if (e.type === "text") {
        expect(e.x).toBeGreaterThanOrEqual(0);
        expect(e.y + e.h).toBeLessThanOrEqual(base.height + 0.01);
      }
    }
  });
  it("QR 켜면 qr 요소가 오른쪽에 추가되고 본문 폭이 줄어든다", () => {
    const a = computeLabelLayout(base, approxMeasurer);
    const b = computeLabelLayout({ ...base, showQR: true, qrData: "https://x/c/1" }, approxMeasurer);
    const qr = b.elements.find((e) => e.type === "qr");
    expect(qr).toBeTruthy();
    const ta = a.elements.find((e) => e.type === "text")!;
    const tb = b.elements.find((e) => e.type === "text")!;
    expect(tb.type === "text" && ta.type === "text" && tb.w < ta.w).toBe(true);
    expect(qr!.type === "qr" && qr!.x + qr!.size <= base.width).toBe(true);
  });
  it("아이용: 아이콘 요소와 큰 글씨", () => {
    const l = computeLabelLayout({ ...base, preset: "kids", icon: "🧦", location: null }, approxMeasurer);
    expect(l.elements.some((e) => e.type === "icon")).toBe(true);
    expect(l.titleSize).toBeGreaterThan(18);
  });
  it("냉장고용: 날짜 기입란(rect) 포함", () => {
    const l = computeLabelLayout({ ...base, preset: "fridge" }, approxMeasurer);
    expect(l.elements.some((e) => e.type === "rect")).toBe(true);
  });
  it("문구가 너무 길면 경고", () => {
    const l = computeLabelLayout({ ...base, width: 25, height: 12, text: "아주아주아주아주아주아주 긴 이름의 서랍" }, approxMeasurer);
    expect(l.fits).toBe(false);
    expect(l.warnings.length).toBe(1);
  });
});
