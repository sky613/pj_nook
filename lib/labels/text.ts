import type { Label } from "@/lib/types";
import type { HomeData } from "@/store/homeStore";
import { locateCompartment, locationText } from "@/store/selectors";
import { labelContentHash, type LabelContent } from "./hash";

export interface ResolvedLabel {
  label: Label;
  text: string;
  location: string | null;
  items: string[];
  icon?: string;
  color?: string;
  orphan: boolean; // 연결된 칸이 사라진 경우
  hash: string;
  needsReprint: boolean;
  qrPath: string | null; // "/c/{compartmentId}"
}

/** 라벨 + 홈 데이터 -> 실제 출력 문구/위치/해시 */
export function resolveLabel(label: Label, data: HomeData): ResolvedLabel {
  const loc = label.compartmentId ? locateCompartment(data, label.compartmentId) : null;
  const orphan = !!label.compartmentId && !loc;
  const text = (label.customText?.trim() || loc?.compartment.name || "(이름 없음)").trim();
  const location = loc && label.style.showLocation ? locationText(loc) : null;
  const content: LabelContent = {
    text,
    location,
    items: loc?.compartment.items ?? [],
    icon: loc?.compartment.icon,
    color: loc?.compartment.color,
    style: label.style,
  };
  const hash = labelContentHash(content);
  return {
    label,
    text,
    location,
    items: content.items,
    icon: content.icon,
    color: content.color,
    orphan,
    hash,
    needsReprint: !!label.printedHash && label.printedHash !== hash,
    qrPath: label.compartmentId ? `/c/${label.compartmentId}` : null,
  };
}
