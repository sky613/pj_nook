import { describe, expect, it } from "vitest";
import { migrateDocument, MigrationError } from "@/store/storage/migrations";
import { buildSampleDocument } from "@/lib/sample/sampleHome";
import { SCHEMA_VERSION } from "@/lib/types";

describe("migrateDocument", () => {
  it("현재 버전 샘플 문서를 그대로 통과시킨다", () => {
    const doc = migrateDocument(buildSampleDocument());
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.rooms).toHaveLength(1);
    expect(doc.compartments.length).toBeGreaterThan(0);
  });

  it("v0 (schemaVersion 없음) 문서의 라벨에 selected/qty 를 채운다", () => {
    const sample = buildSampleDocument();
    const v0 = {
      home: sample.home,
      rooms: sample.rooms,
      furniture: sample.furniture,
      compartments: sample.compartments,
      labels: [{ id: "x", compartmentId: "sc-d1", style: { preset: "minimal" }, createdAt: 1 }],
    };
    const doc = migrateDocument(v0);
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.labels[0].selected).toBe(true);
    expect(doc.labels[0].qty).toBe(1);
    expect(doc.labels[0].style.showLocation).toBe(true);
    expect(doc.customSheetSpecs).toEqual([]);
  });

  it("미래 버전은 거부한다", () => {
    expect(() => migrateDocument({ ...buildSampleDocument(), schemaVersion: SCHEMA_VERSION + 1 })).toThrow(MigrationError);
  });

  it("형식이 깨진 문서는 거부한다", () => {
    expect(() => migrateDocument({ schemaVersion: 1, rooms: "nope" })).toThrow(MigrationError);
    expect(() => migrateDocument("string")).toThrow(MigrationError);
  });
});
