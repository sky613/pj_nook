"use client";

import { Arc, Circle, Group, Layer, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Opening, Point } from "@/lib/types";
import { isClockwise, midpoint, outwardNormal, pointOnWall, projectOnWall, wallDirection, wallLength, walls } from "@/lib/geometry/polygon";
import { snapPoint, snapValue } from "@/lib/geometry/snap";
import type { EditorTool, Selection } from "@/store/editorUiStore";

interface Props {
  polygon: Point[];
  openings: Opening[];
  scale: number;
  tool: EditorTool;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onVertexDrag: (index: number, p: Point, free: boolean) => void;
  onVertexDragEnd: () => void;
  onWallClick: (index: number, world: Point) => void;
  onWallDblClick: (index: number, world: Point) => void;
  onOpeningDrag: (id: string, offset: number) => void;
  onOpeningDragEnd: () => void;
}

const worldPointer = (e: KonvaEventObject<Event>): Point => {
  const stage = e.target.getStage()!;
  const p = stage.getPointerPosition()!;
  return { x: (p.x - stage.x()) / stage.scaleX(), y: (p.y - stage.y()) / stage.scaleY() };
};

export function RoomLayer(props: Props) {
  const { polygon, openings, scale, tool, selection, onSelect } = props;
  const s = scale;
  const cw = isClockwise(polygon);
  const flat = polygon.flatMap((p) => [p.x, p.y]);

  return (
    <Layer>
      {/* 바닥 */}
      <Line points={flat} closed fill="#fafaf9" stroke="#1f2937" strokeWidth={3} strokeScaleEnabled={false} lineJoin="miter" listening={false} />

      {/* 벽 (클릭 영역) */}
      {walls(polygon).map((w) => {
        const selected = selection.kind === "wall" && selection.index === w.index;
        return (
          <Line
            key={`wall-${w.index}`}
            points={[w.a.x, w.a.y, w.b.x, w.b.y]}
            stroke={selected ? "#2563eb" : "#1f2937"}
            strokeWidth={selected ? 5 : 3}
            hitStrokeWidth={16}
            strokeScaleEnabled={false}
            onMouseEnter={(e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = tool === "select" ? "pointer" : "crosshair";
            }}
            onMouseLeave={(e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = "default";
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              props.onWallClick(w.index, worldPointer(e));
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              props.onWallClick(w.index, worldPointer(e));
            }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              props.onWallDblClick(w.index, worldPointer(e));
            }}
          />
        );
      })}

      {/* 개구부 */}
      {openings.map((o) => {
        if (o.wallIndex >= polygon.length) return null;
        const pos = pointOnWall(polygon, o.wallIndex, o.offset);
        const d = wallDirection(polygon, o.wallIndex);
        const angle = (Math.atan2(d.y, d.x) * 180) / Math.PI;
        const selected = selection.kind === "opening" && selection.id === o.id;
        const inward = cw ? 1 : -1; // 그룹 로컬 +y 가 내부인지
        const len = wallLength(polygon, o.wallIndex);
        return (
          <Group
            key={o.id}
            x={pos.x}
            y={pos.y}
            rotation={angle}
            draggable
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect({ kind: "opening", id: o.id });
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect({ kind: "opening", id: o.id });
            }}
            onDragStart={() => onSelect({ kind: "opening", id: o.id })}
            onDragMove={(e) => {
              const node = e.target as unknown as Konva.Group;
              const { offset } = projectOnWall(polygon, o.wallIndex, node.position());
              const clamped = Math.max(0, Math.min(len - o.width, snapValue(offset)));
              node.position(pointOnWall(polygon, o.wallIndex, clamped));
              props.onOpeningDrag(o.id, clamped);
            }}
            onDragEnd={() => props.onOpeningDragEnd()}
          >
            {/* 벽 끊김 표현 */}
            <Rect x={0} y={-6} width={o.width} height={12} fill="#fafaf9" stroke={selected ? "#2563eb" : "#64748b"} strokeWidth={selected ? 2 : 1} strokeScaleEnabled={false} />
            {o.type === "door" ? (
              <>
                <Line points={[0, 0, 0, inward * o.width]} stroke="#475569" strokeWidth={2} strokeScaleEnabled={false} listening={false} />
                <Arc
                  innerRadius={o.width}
                  outerRadius={o.width}
                  angle={90}
                  rotation={cw ? 0 : -90}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dash={[4, 4]}
                  strokeScaleEnabled={false}
                  listening={false}
                />
              </>
            ) : (
              <>
                <Rect x={0} y={-4} width={o.width} height={8} fill="#bae6fd" listening={false} />
                <Line points={[0, 0, o.width, 0]} stroke="#0284c7" strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
              </>
            )}
            <Text
              text={`${o.type === "door" ? "문" : "창"} ${Math.round(o.width)}`}
              x={0}
              y={inward > 0 ? 10 / s : -22 / s}
              width={o.width}
              align="center"
              fontSize={10 / s}
              fill="#64748b"
              listening={false}
            />
          </Group>
        );
      })}

      {/* 치수선 */}
      {walls(polygon).map((w) => {
        const len = wallLength(polygon, w.index);
        const n = outwardNormal(polygon, w.index);
        const m = midpoint(w.a, w.b);
        const off = 16 / s;
        const W = 90 / s;
        const selected = selection.kind === "wall" && selection.index === w.index;
        return (
          <Text
            key={`dim-${w.index}`}
            x={m.x + n.x * off - W / 2}
            y={m.y + n.y * off - 7 / s}
            width={W}
            align="center"
            text={`${Math.round(len)} cm`}
            fontSize={12 / s}
            fontStyle="bold"
            fill={selected ? "#2563eb" : "#334155"}
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect({ kind: "wall", index: w.index });
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect({ kind: "wall", index: w.index });
            }}
          />
        );
      })}

      {/* 꼭짓점 핸들 */}
      {polygon.map((p, i) => {
        const selected = selection.kind === "vertex" && selection.index === i;
        return (
          <Circle
            key={`v-${i}`}
            x={p.x}
            y={p.y}
            radius={7 / s}
            fill={selected ? "#2563eb" : "#ffffff"}
            stroke="#2563eb"
            strokeWidth={2}
            strokeScaleEnabled={false}
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
              onSelect({ kind: "vertex", index: i });
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect({ kind: "vertex", index: i });
            }}
            onDragStart={() => onSelect({ kind: "vertex", index: i })}
            onDragMove={(e) => {
              const node = e.target as Konva.Circle;
              const free = (e.evt as MouseEvent).altKey === true;
              const pos = node.position();
              const target = free ? pos : snapPoint(pos);
              node.position(target);
              props.onVertexDrag(i, target, free);
            }}
            onDragEnd={() => props.onVertexDragEnd()}
          />
        );
      })}
    </Layer>
  );
}
