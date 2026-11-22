"use client";

import type { NookDocument } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { useHomeStore } from "./homeStore";
import { useLabelStore } from "./labelStore";
import { useSettingsStore } from "./settingsStore";
import { migrateDocument } from "./storage/migrations";

const toRecord = <T extends { id: string }>(arr: T[]): Record<string, T> =>
  Object.fromEntries(arr.map((x) => [x.id, x]));

export function exportDocument(): NookDocument {
  const h = useHomeStore.getState();
  const l = useLabelStore.getState();
  const s = useSettingsStore.getState();
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    home: h.home,
    rooms: Object.values(h.rooms),
    furniture: Object.values(h.furniture),
    compartments: Object.values(h.compartments),
    labels: Object.values(l.labels),
    customSheetSpecs: Object.values(s.customSheetSpecs),
    settings: {
      calibration: s.calibration,
      defaultSheetSpecId: s.defaultSheetSpecId,
      lastStartIndex: s.lastStartIndex,
      qrBaseUrl: s.qrBaseUrl,
    },
  };
}

/** JSON 문자열/객체를 검증·마이그레이션 후 모든 스토어에 적용 */
export function importDocument(raw: unknown): NookDocument {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const doc = migrateDocument(parsed);
  applyDocument(doc);
  return doc;
}

export function applyDocument(doc: NookDocument) {
  useHomeStore.getState().replaceAll({
    home: doc.home,
    rooms: toRecord(doc.rooms),
    furniture: toRecord(doc.furniture),
    compartments: toRecord(doc.compartments),
  });
  useLabelStore.getState().replaceAll({ labels: toRecord(doc.labels) });
  useSettingsStore.getState().replaceAll({
    customSheetSpecs: toRecord(doc.customSheetSpecs),
    calibration: doc.settings.calibration,
    defaultSheetSpecId: doc.settings.defaultSheetSpecId,
    lastStartIndex: doc.settings.lastStartIndex,
    qrBaseUrl: doc.settings.qrBaseUrl ?? "",
  });
  useHomeStore.temporal.getState().clear();
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
