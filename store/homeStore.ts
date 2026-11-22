"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { Compartment, Furniture, FurnitureType, Home, ID, Point, Room, Rotation } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import { newId } from "@/lib/ids";
import { FURNITURE_TYPES, compartmentDefaultName } from "@/config/furnitureTypes";
import { COMPARTMENT_COLORS } from "@/config/labelPresets";
import { getStorageAdapter } from "./storage/localStorageAdapter";
import { STORAGE_KEYS } from "./storage/adapter";
import { migratePersistedSlice } from "./storage/migrations";

export interface HomeData {
  home: Home;
  rooms: Record<ID, Room>;
  furniture: Record<ID, Furniture>;
  compartments: Record<ID, Compartment>;
}

export interface HomeActions {
  setHomeName: (name: string) => void;
  // rooms
  addRoom: (name: string, polygon: Point[]) => Room;
  updateRoom: (id: ID, patch: Partial<Omit<Room, "id">>) => void;
  deleteRoom: (id: ID) => ID[]; // 삭제된 compartment id 목록 (라벨 정리용)
  // furniture
  addFurniture: (roomId: ID, type: FurnitureType, pos: Point) => Furniture;
  updateFurniture: (id: ID, patch: Partial<Omit<Furniture, "id" | "roomId">>) => void;
  setFurnitureGrid: (id: ID, rows: number, cols: number) => void;
  deleteFurniture: (id: ID) => ID[];
  // compartments
  updateCompartment: (id: ID, patch: Partial<Omit<Compartment, "id" | "furnitureId" | "row" | "col">>) => void;
  // bulk
  replaceAll: (data: HomeData) => void;
}

export type HomeState = HomeData & HomeActions;

const emptyHome = (): HomeData => ({
  home: { id: newId(), name: "우리 집" },
  rooms: {},
  furniture: {},
  compartments: {},
});

/** 가구 격자(rows x cols)에 맞춰 칸을 생성/보존/제거 */
export function buildCompartments(
  furniture: Furniture,
  existing: Compartment[],
  rows: number,
  cols: number,
): { keep: Compartment[]; removedIds: ID[] } {
  const byPos = new Map(existing.map((c) => [`${c.row},${c.col}`, c] as const));
  const keep: Compartment[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const found = byPos.get(`${r},${c}`);
      if (found) {
        keep.push(found);
        byPos.delete(`${r},${c}`);
      } else {
        const index = r * cols + c;
        keep.push({
          id: newId(),
          furnitureId: furniture.id,
          name: compartmentDefaultName(furniture.type, index),
          row: r,
          col: c,
          items: [],
          color: COMPARTMENT_COLORS[index % COMPARTMENT_COLORS.length],
          updatedAt: Date.now(),
        });
      }
    }
  }
  return { keep, removedIds: [...byPos.values()].map((c) => c.id) };
}

export const useHomeStore = create<HomeState>()(
  persist(
    temporal(
      (set, get) => ({
        ...emptyHome(),

        setHomeName: (name) => set((s) => ({ home: { ...s.home, name } })),

        addRoom: (name, polygon) => {
          const room: Room = { id: newId(), name, polygon, openings: [], createdAt: Date.now() };
          set((s) => ({ rooms: { ...s.rooms, [room.id]: room } }));
          return room;
        },
        updateRoom: (id, patch) =>
          set((s) => {
            const room = s.rooms[id];
            if (!room) return {};
            return { rooms: { ...s.rooms, [id]: { ...room, ...patch } } };
          }),
        deleteRoom: (id) => {
          const s = get();
          const furnIds = Object.values(s.furniture).filter((f) => f.roomId === id).map((f) => f.id);
          const compIds = Object.values(s.compartments)
            .filter((c) => furnIds.includes(c.furnitureId))
            .map((c) => c.id);
          set((st) => {
            const rooms = { ...st.rooms };
            delete rooms[id];
            const furniture = { ...st.furniture };
            furnIds.forEach((f) => delete furniture[f]);
            const compartments = { ...st.compartments };
            compIds.forEach((c) => delete compartments[c]);
            return { rooms, furniture, compartments };
          });
          return compIds;
        },

        addFurniture: (roomId, type, pos) => {
          const def = FURNITURE_TYPES[type];
          const sameType = Object.values(get().furniture).filter((f) => f.roomId === roomId && f.type === type).length;
          const furniture: Furniture = {
            id: newId(),
            roomId,
            type,
            name: sameType === 0 ? def.label : `${def.label} ${sameType + 1}`,
            x: pos.x,
            y: pos.y,
            width: def.width,
            depth: def.depth,
            rotation: 0 as Rotation,
            rows: def.rows,
            cols: def.cols,
          };
          const { keep } = buildCompartments(furniture, [], def.rows, def.cols);
          set((s) => ({
            furniture: { ...s.furniture, [furniture.id]: furniture },
            compartments: { ...s.compartments, ...Object.fromEntries(keep.map((c) => [c.id, c])) },
          }));
          return furniture;
        },
        updateFurniture: (id, patch) =>
          set((s) => {
            const f = s.furniture[id];
            if (!f) return {};
            return { furniture: { ...s.furniture, [id]: { ...f, ...patch } } };
          }),
        setFurnitureGrid: (id, rows, cols) => {
          const s = get();
          const f = s.furniture[id];
          if (!f) return;
          const existing = Object.values(s.compartments).filter((c) => c.furnitureId === id);
          const { keep, removedIds } = buildCompartments(f, existing, rows, cols);
          set((st) => {
            const compartments = { ...st.compartments };
            removedIds.forEach((c) => delete compartments[c]);
            keep.forEach((c) => (compartments[c.id] = c));
            return { furniture: { ...st.furniture, [id]: { ...f, rows, cols } }, compartments };
          });
        },
        deleteFurniture: (id) => {
          const compIds = Object.values(get().compartments)
            .filter((c) => c.furnitureId === id)
            .map((c) => c.id);
          set((st) => {
            const furniture = { ...st.furniture };
            delete furniture[id];
            const compartments = { ...st.compartments };
            compIds.forEach((c) => delete compartments[c]);
            return { furniture, compartments };
          });
          return compIds;
        },

        updateCompartment: (id, patch) =>
          set((s) => {
            const c = s.compartments[id];
            if (!c) return {};
            return { compartments: { ...s.compartments, [id]: { ...c, ...patch, updatedAt: Date.now() } } };
          }),

        replaceAll: (data) => set(() => ({ ...data })),
      }),
      {
        limit: 100,
        partialize: (s) => ({ rooms: s.rooms, furniture: s.furniture, compartments: s.compartments }),
        equality: (a, b) => a.rooms === b.rooms && a.furniture === b.furniture && a.compartments === b.compartments,
      },
    ),
    {
      name: STORAGE_KEYS.home,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (s) => ({ home: s.home, rooms: s.rooms, furniture: s.furniture, compartments: s.compartments }),
      migrate: (state, v) => migratePersistedSlice<HomeData>(state, v),
    },
  ),
);

export const useHomeTemporal = () => useHomeStore.temporal;
