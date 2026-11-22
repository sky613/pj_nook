"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Calibration, ID, SheetSpec } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { newId } from "@/lib/ids";
import { DEFAULT_SHEET_PRESET_ID, SHEET_PRESETS } from "@/config/sheetPresets";
import { getStorageAdapter } from "./storage/localStorageAdapter";
import { STORAGE_KEYS } from "./storage/adapter";
import { migratePersistedSlice } from "./storage/migrations";

export interface SettingsData {
  customSheetSpecs: Record<ID, SheetSpec>;
  calibration: Calibration;
  defaultSheetSpecId: string;
  lastStartIndex: number;
  qrBaseUrl: string; // 비어 있으면 현재 origin
}

export interface SettingsActions {
  addCustomSheetSpec: (spec: Omit<SheetSpec, "id" | "builtin">) => SheetSpec;
  updateCustomSheetSpec: (id: ID, patch: Partial<Omit<SheetSpec, "id">>) => void;
  deleteCustomSheetSpec: (id: ID) => void;
  setCalibration: (c: Calibration) => void;
  setDefaultSheetSpecId: (id: string) => void;
  setLastStartIndex: (n: number) => void;
  setQrBaseUrl: (url: string) => void;
  replaceAll: (data: SettingsData) => void;
}

export type SettingsState = SettingsData & SettingsActions;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      customSheetSpecs: {},
      calibration: { dx: 0, dy: 0 },
      defaultSheetSpecId: DEFAULT_SHEET_PRESET_ID,
      lastStartIndex: 0,
      qrBaseUrl: "",

      addCustomSheetSpec: (spec) => {
        const full: SheetSpec = { ...spec, id: newId(), pageSize: "A4", builtin: false };
        set((s) => ({ customSheetSpecs: { ...s.customSheetSpecs, [full.id]: full } }));
        return full;
      },
      updateCustomSheetSpec: (id, patch) =>
        set((s) => {
          const cur = s.customSheetSpecs[id];
          if (!cur) return {};
          return { customSheetSpecs: { ...s.customSheetSpecs, [id]: { ...cur, ...patch } } };
        }),
      deleteCustomSheetSpec: (id) =>
        set((s) => {
          const customSheetSpecs = { ...s.customSheetSpecs };
          delete customSheetSpecs[id];
          const defaultSheetSpecId = s.defaultSheetSpecId === id ? DEFAULT_SHEET_PRESET_ID : s.defaultSheetSpecId;
          return { customSheetSpecs, defaultSheetSpecId };
        }),
      setCalibration: (calibration) => set({ calibration }),
      setDefaultSheetSpecId: (defaultSheetSpecId) => set({ defaultSheetSpecId }),
      setLastStartIndex: (lastStartIndex) => set({ lastStartIndex }),
      setQrBaseUrl: (qrBaseUrl) => set({ qrBaseUrl }),
      replaceAll: (data) => set(() => ({ ...data })),
    }),
    {
      name: STORAGE_KEYS.settings,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (s) => ({
        customSheetSpecs: s.customSheetSpecs,
        calibration: s.calibration,
        defaultSheetSpecId: s.defaultSheetSpecId,
        lastStartIndex: s.lastStartIndex,
        qrBaseUrl: s.qrBaseUrl,
      }),
      migrate: (state, v) => migratePersistedSlice<SettingsData>(state, v),
    },
  ),
);

/** 내장 + 사용자 규격 전체 목록 (메모이즈) */
export function useAllSheetSpecs(): SheetSpec[] {
  const custom = useSettingsStore((s) => s.customSheetSpecs);
  return useMemo(() => [...SHEET_PRESETS, ...Object.values(custom)], [custom]);
}

export const getAllSheetSpecs = (): SheetSpec[] => [...SHEET_PRESETS, ...Object.values(useSettingsStore.getState().customSheetSpecs)];
