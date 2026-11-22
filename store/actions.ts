"use client";

/** 여러 스토어에 걸친 조합 액션 */
import { useHomeStore } from "./homeStore";
import { useLabelStore } from "./labelStore";

export function deleteRoomCascade(roomId: string) {
  const removed = useHomeStore.getState().deleteRoom(roomId);
  useLabelStore.getState().deleteLabelsForCompartments(removed);
}

export function deleteFurnitureCascade(furnitureId: string) {
  const removed = useHomeStore.getState().deleteFurniture(furnitureId);
  useLabelStore.getState().deleteLabelsForCompartments(removed);
}

export function setFurnitureGridCascade(furnitureId: string, rows: number, cols: number) {
  const before = new Set(
    Object.values(useHomeStore.getState().compartments)
      .filter((c) => c.furnitureId === furnitureId)
      .map((c) => c.id),
  );
  useHomeStore.getState().setFurnitureGrid(furnitureId, rows, cols);
  const after = new Set(Object.keys(useHomeStore.getState().compartments));
  const removed = [...before].filter((id) => !after.has(id));
  if (removed.length) useLabelStore.getState().deleteLabelsForCompartments(removed);
}
