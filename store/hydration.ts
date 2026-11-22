"use client";

import { useEffect, useState } from "react";
import { useHomeStore } from "./homeStore";
import { useLabelStore } from "./labelStore";
import { useSettingsStore } from "./settingsStore";
import { applyDocument } from "./document";
import { buildSampleDocument } from "@/lib/sample/sampleHome";
import { getStorageAdapter } from "./storage/localStorageAdapter";
import { STORAGE_KEYS } from "./storage/adapter";

const stores = [useHomeStore, useLabelStore, useSettingsStore] as const;

const allHydrated = () => stores.every((s) => s.persist.hasHydrated());

/** 모든 persist 스토어 복원 완료 여부. 최초 접속이면 샘플 데이터를 시드한다. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => {
      if (!allHydrated()) return;
      seedIfEmpty();
      useHomeStore.temporal.getState().clear();
      setReady(true);
    };
    const unsubs = stores.map((s) => s.persist.onFinishHydration(finish));
    finish();
    return () => unsubs.forEach((u) => u());
  }, []);
  return ready;
}

function seedIfEmpty() {
  const adapter = getStorageAdapter();
  const seeded = adapter.getItem(STORAGE_KEYS.seeded);
  if (seeded) return;
  const hasRooms = Object.keys(useHomeStore.getState().rooms).length > 0;
  if (!hasRooms) applyDocument(buildSampleDocument());
  void adapter.setItem(STORAGE_KEYS.seeded, "1");
}

export function loadSampleData() {
  applyDocument(buildSampleDocument());
}
