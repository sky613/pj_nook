"use client";

import { useEffect, useRef } from "react";
import { Group, Layer, Line, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Furniture } from "@/lib/types";
import { FURNITURE_TYPES } from "@/config/furnitureTypes";
import { furnitureRect, hasWarning, type FurnitureWarning } from "@/lib/geometry/overlap";
import { snapPoint, snapValue } from "@/lib/geometry/snap";
import type { Selection } from "@/store/editorUiStore";

interface Props {
  list: Furniture[];
  warnings: Record<string, FurnitureWarning>;
  scale: number;
  selection: Selection;
  highlightId: string | null;
  onSelect: (id: string) => void;
  onOpenFront: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, patch: { x: number; y: number; width: number; depth: number }) => void;
}

/** 정면 표시선: 회전별 정면 변 (0=아래, 90=왼쪽, 180=위, 270=오른쪽) */
const frontLine = (rot: number, w: number, h: number): number[] => {
  switch (rot) {
    case 90:
      return [0, 0, 0, h];
    case 180:
      return [0, 0, w, 0];
    case 270:
      return [w, 0, w, h];
    default:
      return [0, h, w, h];
  }
};

export function FurnitureLayer(props: Props) {
  const { list, warnings, scale: s, selection, highlightId, onSelect } = props;
  const trRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const selectedId = selection.kind === "furniture" ? selection.id : null;

  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    const node = selectedId ? layer.findOne<Konva.Group>(`#furn-${selectedId}`) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, list]);

  return (
    <Layer ref={layerRef}>
      {list.map((f) => {
        const r = furnitureRect(f);
        const def = FURNITURE_TYPES[f.type];
        const warn = hasWarning(warnings[f.id]);
        const selected = selectedId === f.id;
        const highlighted = highlightId === f.id;
        const fontSize = Math.min(12 / s, Math.max(6, Math.min(r.w, r.h) / 4));
        return (
          <Group
            key={f.id}
            id={`furn-${f.id}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            draggable
            onMouseEnter={(e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = "move";
            }}
            onMouseLeave={(e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = "default";
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect(f.id);
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect(f.id);
            }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              props.onOpenFront(f.id);
            }}
            onDblTap={(e) => {
              e.cancelBubble = true;
              props.onOpenFront(f.id);
            }}
            onDragStart={() => onSelect(f.id)}
            onDragMove={(e) => {
              const node = e.target as unknown as Konva.Group;
              node.position(snapPoint(node.position()));
            }}
            onDragEnd={(e) => {
              const node = e.target as unknown as Konva.Group;
              const p = snapPoint(node.position());
              props.onMove(f.id, p.x, p.y);
            }}
            onTransformEnd={(e) => {
              const node = e.target as unknown as Konva.Group;
              const sx = node.scaleX();
              const sy = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              const nw = Math.max(10, snapValue(r.w * sx));
              const nh = Math.max(10, snapValue(r.h * sy));
              const p = snapPoint(node.position());
              const swap = f.rotation === 90 || f.rotation === 270;
              props.onResize(f.id, { x: p.x, y: p.y, width: swap ? nh : nw, depth: swap ? nw : nh });
            }}
          >
            <Rect
              width={r.w}
              height={r.h}
              fill={def.color}
              opacity={highlighted ? 1 : 0.85}
              stroke={warn ? "#dc2626" : highlighted ? "#f59e0b" : selected ? "#2563eb" : "#44403c"}
              strokeWidth={warn || highlighted ? 3 : selected ? 2.5 : 1.5}
              strokeScaleEnabled={false}
              dash={warn ? [6, 4] : undefined}
              cornerRadius={2}
              shadowColor={highlighted ? "#f59e0b" : undefined}
              shadowBlur={highlighted ? 20 : 0}
              shadowOpacity={0.8}
            />
            <Line points={frontLine(f.rotation, r.w, r.h)} stroke="#1c1917" strokeWidth={4} strokeScaleEnabled={false} listening={false} />
            <Text
              text={`${f.name}${warn ? " ⚠" : ""}`}
              width={r.w}
              height={r.h}
              align="center"
              verticalAlign="middle"
              fontSize={fontSize}
              fontStyle="bold"
              fill="#1c1917"
              padding={2}
              listening={false}
              ellipsis
              wrap="none"
            />
          </Group>
        );
      })}
      <Transformer
        ref={trRef}
        rotateEnabled={false}
        keepRatio={false}
        ignoreStroke
        anchorSize={8}
        borderStroke="#2563eb"
        anchorStroke="#2563eb"
        anchorFill="#ffffff"
        enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]}
        boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 * s || newBox.height < 10 * s ? oldBox : newBox)}
      />
    </Layer>
  );
}
