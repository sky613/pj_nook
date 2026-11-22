/**
 * 핵심 데이터 모델. 모든 치수는 cm(방·가구) 또는 mm(라벨지)로 저장한다.
 * 화면 px 변환은 lib/units.ts 와 뷰 상태에서만 처리한다.
 */

export type ID = string;

export interface Point {
  x: number; // cm
  y: number; // cm
}

export type OpeningType = "door" | "window";

export interface Opening {
  id: ID;
  type: OpeningType;
  wallIndex: number; // polygon[i] -> polygon[i+1] 벽
  offset: number; // 벽 시작점으로부터 cm
  width: number; // cm
}

export interface Room {
  id: ID;
  name: string;
  polygon: Point[]; // cm, 시계방향/반시계 무관
  openings: Opening[];
  createdAt: number;
}

export type FurnitureType = "drawer" | "bookshelf" | "wardrobe" | "storage_box" | "fridge";

export type Rotation = 0 | 90 | 180 | 270;

export interface Furniture {
  id: ID;
  roomId: ID;
  type: FurnitureType;
  name: string;
  x: number; // cm, 회전 전 좌상단
  y: number; // cm
  width: number; // cm (정면 폭)
  depth: number; // cm
  rotation: Rotation;
  rows: number; // 정면도 칸 격자
  cols: number;
}

export interface Compartment {
  id: ID;
  furnitureId: ID;
  name: string;
  row: number; // 0-based, 위에서 아래
  col: number; // 0-based, 왼쪽에서 오른쪽
  items: string[];
  color: string; // hex
  icon?: string; // 이모지
  updatedAt: number;
}

export type LabelPreset = "minimal" | "kids" | "fridge";

export interface LabelStyle {
  preset: LabelPreset;
  font: "noto-sans-kr";
  showLocation: boolean;
  showQR: boolean;
}

export interface Label {
  id: ID;
  compartmentId: ID | null; // null = 빠른 라벨
  customText?: string; // 비어 있으면 칸 이름 사용
  style: LabelStyle;
  qty: number;
  selected: boolean; // 출력 대상
  printedAt?: number;
  printedHash?: string; // 출력 당시 내용 해시 (재출력 필요 판정)
  createdAt: number;
}

export interface SheetSpec {
  id: ID;
  name: string;
  pageSize: "A4";
  cols: number;
  rows: number;
  labelWidth: number; // mm
  labelHeight: number; // mm
  marginTop: number; // mm
  marginLeft: number; // mm
  gapX: number; // mm
  gapY: number; // mm
  builtin?: boolean;
}

export interface Calibration {
  dx: number; // mm, +면 오른쪽
  dy: number; // mm, +면 아래
}

export interface Home {
  id: ID;
  name: string;
}

/** 내보내기/가져오기 문서 형태 */
export interface NookDocument {
  schemaVersion: number;
  exportedAt: number;
  home: Home;
  rooms: Room[];
  furniture: Furniture[];
  compartments: Compartment[];
  labels: Label[];
  customSheetSpecs: SheetSpec[];
  settings: {
    calibration: Calibration;
    defaultSheetSpecId: string;
    lastStartIndex: number;
    qrBaseUrl?: string;
  };
}

export const SCHEMA_VERSION = 1;
