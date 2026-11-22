import { SCHEMA_VERSION, type NookDocument } from "@/lib/types";
import { documentSchema } from "./schema";

type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;

/**
 * 버전 n -> n+1 변환. 키는 "출발 버전".
 * v0: schemaVersion 이 없던 초기 내보내기 형식 (labels.selected / qty 누락 가능)
 */
const migrations: Record<number, Migration> = {
  0: (doc) => {
    const labels = Array.isArray(doc.labels) ? (doc.labels as Record<string, unknown>[]) : [];
    return {
      ...doc,
      schemaVersion: 1,
      labels: labels.map((l) => ({ selected: true, qty: 1, ...l })),
      customSheetSpecs: doc.customSheetSpecs ?? [],
    };
  },
};

export class MigrationError extends Error {}

/** 임의 JSON 을 현재 스키마의 NookDocument 로 변환 (검증 포함) */
export function migrateDocument(raw: unknown): NookDocument {
  if (!raw || typeof raw !== "object") throw new MigrationError("JSON 객체가 아닙니다.");
  let doc = { ...(raw as Record<string, unknown>) };
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    throw new MigrationError(`지원하지 않는 schemaVersion ${version} (현재 ${SCHEMA_VERSION})`);
  }
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) throw new MigrationError(`버전 ${version} 마이그레이션이 없습니다.`);
    doc = step(doc);
    version += 1;
  }
  const parsed = documentSchema.safeParse(doc);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new MigrationError(`형식 오류: ${first.path.join(".")} ${first.message}`);
  }
  return parsed.data as NookDocument;
}

/** persist 슬라이스별 마이그레이션 (현재는 v1 이 최초 버전) */
export function migratePersistedSlice<T>(state: unknown, _fromVersion: number): T {
  return state as T;
}
