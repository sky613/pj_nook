import { describe, expect, it } from "vitest";
import { buildSampleDocument } from "@/lib/sample/sampleHome";
import { searchCompartments } from "@/store/selectors";
import type { HomeData } from "@/store/homeStore";

const doc = buildSampleDocument();
const byId = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
const data: HomeData = { home: doc.home, rooms: byId(doc.rooms), furniture: byId(doc.furniture), compartments: byId(doc.compartments) };
const ids = (q: string) => searchCompartments(data, q).map((r) => r.compartment.id);

describe("searchCompartments", () => {
  it("빈 검색어는 결과 없음", () => {
    expect(ids("  ")).toEqual([]);
  });
  it("물건 이름 부분 일치", () => {
    expect(ids("케이블")).toEqual(["sc-d3"]);
    expect(ids("아이스")).toEqual(["sc-f3"]);
  });
  it("가구·방 이름으로도 찾는다", () => {
    expect(ids("냉장고")).toEqual(["sc-f1", "sc-f2", "sc-f3"]);
    expect(ids("원룸")).toHaveLength(doc.compartments.length);
  });
  it("영문은 대소문자 무시", () => {
    const d: HomeData = { ...data, compartments: { ...data.compartments, x: { ...data.compartments["sc-d1"], id: "x", items: ["USB Hub"] } } };
    expect(searchCompartments(d, "usb").map((r) => r.compartment.id)).toEqual(["x"]);
  });
});
