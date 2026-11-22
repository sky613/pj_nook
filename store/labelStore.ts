"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ID, Label, LabelStyle } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { newId } from "@/lib/ids";
import { defaultLabelStyle } from "@/config/labelPresets";
import { getStorageAdapter } from "./storage/localStorageAdapter";
import { STORAGE_KEYS } from "./storage/adapter";
import { migratePersistedSlice } from "./storage/migrations";

export interface LabelData {
  labels: Record<ID, Label>;
}

export interface LabelActions {
  addLabelForCompartment: (compartmentId: ID, style?: LabelStyle) => Label;
  addQuickLabel: (text: string, style?: LabelStyle) => Label;
  updateLabel: (id: ID, patch: Partial<Omit<Label, "id">>) => void;
  deleteLabel: (id: ID) => void;
  deleteLabelsForCompartments: (compartmentIds: ID[]) => void;
  setSelected: (ids: ID[], selected: boolean) => void;
  markPrinted: (entries: { id: ID; hash: string }[]) => void;
  replaceAll: (data: LabelData) => void;
}

export type LabelState = LabelData & LabelActions;

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      labels: {},

      addLabelForCompartment: (compartmentId, style) => {
        const label: Label = {
          id: newId(),
          compartmentId,
          style: style ?? defaultLabelStyle(),
          qty: 1,
          selected: true,
          createdAt: Date.now(),
        };
        set((s) => ({ labels: { ...s.labels, [label.id]: label } }));
        return label;
      },
      addQuickLabel: (text, style) => {
        const label: Label = {
          id: newId(),
          compartmentId: null,
          customText: text,
          style: style ?? { ...defaultLabelStyle(), showLocation: false },
          qty: 1,
          selected: true,
          createdAt: Date.now(),
        };
        set((s) => ({ labels: { ...s.labels, [label.id]: label } }));
        return label;
      },
      updateLabel: (id, patch) =>
        set((s) => {
          const l = s.labels[id];
          if (!l) return {};
          return { labels: { ...s.labels, [id]: { ...l, ...patch } } };
        }),
      deleteLabel: (id) =>
        set((s) => {
          const labels = { ...s.labels };
          delete labels[id];
          return { labels };
        }),
      deleteLabelsForCompartments: (compartmentIds) =>
        set((s) => {
          const setIds = new Set(compartmentIds);
          const labels = Object.fromEntries(
            Object.entries(s.labels).filter(([, l]) => !l.compartmentId || !setIds.has(l.compartmentId)),
          );
          return { labels };
        }),
      setSelected: (ids, selected) =>
        set((s) => {
          const labels = { ...s.labels };
          ids.forEach((id) => {
            if (labels[id]) labels[id] = { ...labels[id], selected };
          });
          return { labels };
        }),
      markPrinted: (entries) =>
        set((s) => {
          const labels = { ...s.labels };
          const now = Date.now();
          entries.forEach(({ id, hash }) => {
            if (labels[id]) labels[id] = { ...labels[id], printedAt: now, printedHash: hash };
          });
          return { labels };
        }),
      replaceAll: (data) => set(() => ({ ...data })),
    }),
    {
      name: STORAGE_KEYS.labels,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (s) => ({ labels: s.labels }),
      migrate: (state, v) => migratePersistedSlice<LabelData>(state, v),
    },
  ),
);
