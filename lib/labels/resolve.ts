"use client";

import { useMemo } from "react";
import type { Label, SheetSpec } from "@/lib/types";
import { useHomeStore } from "@/store/homeStore";
import { useLabelStore } from "@/store/labelStore";
import { useSettingsStore } from "@/store/settingsStore";
import { resolveLabel, type ResolvedLabel } from "./text";
import type { LabelLayoutInput } from "./layout";
import { qrUrl } from "./qr";

/** 모든 라벨을 현재 홈 데이터로 해석 (생성 순) */
export function useResolvedLabels(): ResolvedLabel[] {
  const labels = useLabelStore((s) => s.labels);
  const home = useHomeStore((s) => s.home);
  const rooms = useHomeStore((s) => s.rooms);
  const furniture = useHomeStore((s) => s.furniture);
  const compartments = useHomeStore((s) => s.compartments);
  return useMemo(
    () =>
      Object.values(labels)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((l) => resolveLabel(l, { home, rooms, furniture, compartments })),
    [labels, home, rooms, furniture, compartments],
  );
}

export function useResolvedLabel(id: string): ResolvedLabel | null {
  const label = useLabelStore((s) => s.labels[id]) as Label | undefined;
  const home = useHomeStore((s) => s.home);
  const rooms = useHomeStore((s) => s.rooms);
  const furniture = useHomeStore((s) => s.furniture);
  const compartments = useHomeStore((s) => s.compartments);
  return useMemo(() => (label ? resolveLabel(label, { home, rooms, furniture, compartments }) : null), [label, home, rooms, furniture, compartments]);
}

export function useQrBaseUrl() {
  return useSettingsStore((s) => s.qrBaseUrl);
}

/** 해석된 라벨 + 라벨지 칸 크기 -> 배치 입력 */
export function toLayoutInput(r: ResolvedLabel, spec: Pick<SheetSpec, "labelWidth" | "labelHeight">, qrBase: string): LabelLayoutInput {
  return {
    width: spec.labelWidth,
    height: spec.labelHeight,
    text: r.text,
    location: r.location,
    items: r.items,
    icon: r.icon,
    preset: r.label.style.preset,
    showQR: r.label.style.showQR,
    qrData: r.label.style.showQR && r.qrPath ? qrUrl(r.qrPath, qrBase) : null,
  };
}
