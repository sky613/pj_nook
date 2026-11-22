import { describe, expect, it } from "vitest";
import { labelContentHash, fnv1a } from "@/lib/labels/hash";
import { defaultLabelStyle } from "@/config/labelPresets";

describe("labelContentHash", () => {
  const base = { text: "1번 서랍", location: "원룸 > 서랍장 > 1번 서랍", items: ["양말"], style: defaultLabelStyle() };
  it("같은 내용은 같은 해시", () => {
    expect(labelContentHash(base)).toBe(labelContentHash({ ...base, items: ["양말"] }));
  });
  it("물건 변경 시 해시가 바뀐다", () => {
    expect(labelContentHash(base)).not.toBe(labelContentHash({ ...base, items: ["양말", "속옷"] }));
  });
  it("스타일 변경 시 해시가 바뀐다", () => {
    expect(labelContentHash(base)).not.toBe(labelContentHash({ ...base, style: { ...base.style, showQR: true } }));
  });
  it("fnv1a 는 8자리 hex", () => {
    expect(fnv1a("abc")).toMatch(/^[0-9a-f]{8}$/);
  });
});
