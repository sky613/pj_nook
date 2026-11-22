import type { LabelPreset, LabelStyle } from "@/lib/types";

export interface LabelPresetDef {
  preset: LabelPreset;
  label: string;
  description: string;
  /** 본문 글자 크기 범위 (pt) */
  fontMax: number;
  fontMin: number;
  showIcon: boolean;
  showDateField: boolean; // 냉장고용 날짜 기입란
  showItems: boolean; // 물건 목록 소문자 표시
  bold: boolean;
}

export const LABEL_PRESETS: Record<LabelPreset, LabelPresetDef> = {
  minimal: {
    preset: "minimal",
    label: "미니멀",
    description: "칸 이름 중심의 깔끔한 라벨",
    fontMax: 18,
    fontMin: 8,
    showIcon: false,
    showDateField: false,
    showItems: true,
    bold: false,
  },
  kids: {
    preset: "kids",
    label: "아이용",
    description: "큰 글씨와 아이콘",
    fontMax: 26,
    fontMin: 10,
    showIcon: true,
    showDateField: false,
    showItems: false,
    bold: true,
  },
  fridge: {
    preset: "fridge",
    label: "냉장고용",
    description: "날짜 기입란 포함",
    fontMax: 16,
    fontMin: 8,
    showIcon: false,
    showDateField: true,
    showItems: true,
    bold: false,
  },
};

export const LABEL_PRESET_LIST = Object.values(LABEL_PRESETS);

export const defaultLabelStyle = (preset: LabelPreset = "minimal"): LabelStyle => ({
  preset,
  font: "noto-sans-kr",
  showLocation: true,
  showQR: false,
});

export const COMPARTMENT_COLORS = [
  "#f4f4f5", "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bae6fd", "#c7d2fe", "#f5d0fe",
];
