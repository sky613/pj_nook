"use client";

import { create } from "zustand";
import type { OpeningType } from "@/lib/types";

export type EditorTool = "select" | "door" | "window";

export type Selection =
  | { kind: "none" }
  | { kind: "vertex"; index: number }
  | { kind: "wall"; index: number }
  | { kind: "opening"; id: string }
  | { kind: "furniture"; id: string };

export interface EditorView {
  scale: number; // px per cm
  x: number;
  y: number;
}

interface EditorUiState {
  tool: EditorTool;
  selection: Selection;
  frontViewFurnitureId: string | null;
  highlight: { furnitureId: string | null; compartmentId: string | null };
  setTool: (t: EditorTool) => void;
  select: (s: Selection) => void;
  openFrontView: (furnitureId: string | null) => void;
  setHighlight: (furnitureId: string | null, compartmentId: string | null) => void;
}

export const useEditorUi = create<EditorUiState>((set) => ({
  tool: "select",
  selection: { kind: "none" },
  frontViewFurnitureId: null,
  highlight: { furnitureId: null, compartmentId: null },
  setTool: (tool) => set({ tool }),
  select: (selection) => set({ selection }),
  openFrontView: (frontViewFurnitureId) => set({ frontViewFurnitureId }),
  setHighlight: (furnitureId, compartmentId) => set({ highlight: { furnitureId, compartmentId } }),
}));

export const openingDefaults: Record<OpeningType, { width: number; label: string }> = {
  door: { width: 90, label: "문" },
  window: { width: 120, label: "창문" },
};
