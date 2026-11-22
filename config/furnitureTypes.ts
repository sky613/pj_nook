import type { FurnitureType } from "@/lib/types";

export interface FurnitureTypeDef {
  type: FurnitureType;
  label: string;
  width: number; // cm
  depth: number; // cm
  rows: number;
  cols: number;
  color: string;
  compartmentNoun: string; // "N번 서랍" 등
}

export const FURNITURE_TYPES: Record<FurnitureType, FurnitureTypeDef> = {
  drawer: { type: "drawer", label: "서랍장", width: 80, depth: 45, rows: 3, cols: 1, color: "#c7a17a", compartmentNoun: "서랍" },
  bookshelf: { type: "bookshelf", label: "책장", width: 80, depth: 30, rows: 4, cols: 2, color: "#9fb7c9", compartmentNoun: "칸" },
  wardrobe: { type: "wardrobe", label: "옷장", width: 120, depth: 60, rows: 1, cols: 2, color: "#b8a9c9", compartmentNoun: "칸" },
  storage_box: { type: "storage_box", label: "수납박스", width: 40, depth: 30, rows: 1, cols: 1, color: "#a9c9a4", compartmentNoun: "칸" },
  fridge: { type: "fridge", label: "냉장고", width: 90, depth: 70, rows: 3, cols: 1, color: "#c9c9c9", compartmentNoun: "칸" },
};

export const FURNITURE_TYPE_LIST = Object.values(FURNITURE_TYPES);

export const compartmentDefaultName = (type: FurnitureType, index: number) =>
  `${index + 1}번 ${FURNITURE_TYPES[type].compartmentNoun}`;
