"use client";

import { Layer, Line } from "react-konva";
import { GRID_CM } from "@/lib/geometry/snap";

interface Props {
  /** 보이는 월드 영역 (cm) */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  scale: number;
}

export function GridLayer({ minX, minY, maxX, maxY, scale }: Props) {
  const minor = GRID_CM;
  const major = GRID_CM * 10;
  // 너무 축소되면 10cm 격자는 생략
  const showMinor = scale * minor >= 6;
  const step = showMinor ? minor : major;
  const x0 = Math.floor(minX / step) * step;
  const y0 = Math.floor(minY / step) * step;
  const lines: React.ReactNode[] = [];
  for (let x = x0; x <= maxX; x += step) {
    const isMajor = Math.abs(x % major) < 1e-6;
    lines.push(
      <Line key={`v${x}`} points={[x, minY, x, maxY]} stroke={isMajor ? "#d4d4d8" : "#ececef"} strokeWidth={isMajor ? 1 : 0.5} strokeScaleEnabled={false} listening={false} />,
    );
  }
  for (let y = y0; y <= maxY; y += step) {
    const isMajor = Math.abs(y % major) < 1e-6;
    lines.push(
      <Line key={`h${y}`} points={[minX, y, maxX, y]} stroke={isMajor ? "#d4d4d8" : "#ececef"} strokeWidth={isMajor ? 1 : 0.5} strokeScaleEnabled={false} listening={false} />,
    );
  }
  return <Layer listening={false}>{lines}</Layer>;
}
