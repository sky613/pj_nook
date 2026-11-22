import type { Compartment, Furniture, Room } from "@/lib/types";
import type { HomeData } from "./homeStore";

export interface CompartmentLocation {
  room: Room;
  furniture: Furniture;
  compartment: Compartment;
}

export function locateCompartment(data: HomeData, compartmentId: string): CompartmentLocation | null {
  const compartment = data.compartments[compartmentId];
  if (!compartment) return null;
  const furniture = data.furniture[compartment.furnitureId];
  if (!furniture) return null;
  const room = data.rooms[furniture.roomId];
  if (!room) return null;
  return { room, furniture, compartment };
}

export const locationText = (loc: CompartmentLocation) =>
  `${loc.room.name} > ${loc.furniture.name} > ${loc.compartment.name}`;

export const compartmentsOf = (data: HomeData, furnitureId: string) =>
  Object.values(data.compartments)
    .filter((c) => c.furnitureId === furnitureId)
    .sort((a, b) => a.row - b.row || a.col - b.col);

export const furnitureOf = (data: HomeData, roomId: string) =>
  Object.values(data.furniture).filter((f) => f.roomId === roomId);

export const roomsSorted = (data: HomeData) => Object.values(data.rooms).sort((a, b) => a.createdAt - b.createdAt);

/** 물건·칸·가구·방 이름 부분 일치 검색 (대소문자 무시) */
export function searchCompartments(data: HomeData, query: string): CompartmentLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(data.compartments)
    .map((c) => locateCompartment(data, c.id))
    .filter((loc): loc is CompartmentLocation => !!loc)
    .filter((loc) =>
      [loc.room.name, loc.furniture.name, loc.compartment.name, ...loc.compartment.items].some((s) => s.toLowerCase().includes(q)),
    );
}
