"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { FurnitureType, Opening, OpeningType, Point } from "@/lib/types";
import { useHomeStore } from "@/store/homeStore";
import { useEditorUi, openingDefaults, type EditorView } from "@/store/editorUiStore";
import { centroid, polygonBounds, projectOnWall, wallLength } from "@/lib/geometry/polygon";
import { computeWarnings } from "@/lib/geometry/overlap";
import { furnitureOf } from "@/store/selectors";
import { deleteFurnitureCascade } from "@/store/actions";
import { FURNITURE_TYPE_LIST } from "@/config/furnitureTypes";
import { snapPoint, snapValue } from "@/lib/geometry/snap";
import {
  clampOpenings,
  insertVertex,
  moveVertex,
  remapOpeningsAfterInsert,
  remapOpeningsAfterRemove,
  removeVertex,
  setWallLength,
} from "@/lib/geometry/wall";
import { newId } from "@/lib/ids";
import { useStageSize } from "./useStageSize";
import { GridLayer } from "./GridLayer";
import { RoomLayer } from "./RoomLayer";
import { EditorToolbar } from "./EditorToolbar";
import { SelectionPanel } from "./SelectionPanel";
import { FurnitureLayer } from "./FurnitureLayer";
import { FurniturePanel, rotateCw } from "./FurniturePanel";
import { FurnitureFrontView } from "./FurnitureFrontView";

const MIN_SCALE = 0.15;
const MAX_SCALE = 12;

export default function RoomEditor({ roomId }: { roomId: string }) {
  const room = useHomeStore((s) => s.rooms[roomId]);
  const updateRoom = useHomeStore((s) => s.updateRoom);
  const tool = useEditorUi((s) => s.tool);
  const setTool = useEditorUi((s) => s.setTool);
  const selection = useEditorUi((s) => s.selection);
  const select = useEditorUi((s) => s.select);
  const frontViewFurnitureId = useEditorUi((s) => s.frontViewFurnitureId);
  const openFrontView = useEditorUi((s) => s.openFrontView);
  const highlight = useEditorUi((s) => s.highlight);
  const furnitureMap = useHomeStore((s) => s.furniture);
  const addFurniture = useHomeStore((s) => s.addFurniture);
  const updateFurniture = useHomeStore((s) => s.updateFurniture);

  const furnitureList = useMemo(
    () => (room ? furnitureOf({ home: { id: "", name: "" }, rooms: {}, furniture: furnitureMap, compartments: {} }, room.id) : []),
    [furnitureMap, room],
  );
  const warnings = useMemo(() => (room ? computeWarnings(furnitureList, room.polygon) : {}), [furnitureList, room]);
  const furnitureNames = useMemo(() => Object.fromEntries(furnitureList.map((f) => [f.id, f.name])), [furnitureList]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const size = useStageSize(containerRef);
  const [view, setView] = useState<EditorView>({ scale: 1, x: 0, y: 0 });
  const [draftPolygon, setDraftPolygon] = useState<Point[] | null>(null);
  const [draftOpening, setDraftOpening] = useState<{ id: string; offset: number } | null>(null);
  const fitted = useRef(false);

  const polygon = draftPolygon ?? room?.polygon ?? [];
  const openings = useMemo(() => {
    const list = room?.openings ?? [];
    if (!draftOpening) return list;
    return list.map((o) => (o.id === draftOpening.id ? { ...o, offset: draftOpening.offset } : o));
  }, [room?.openings, draftOpening]);

  // 방 전환 시 선택 초기화
  useEffect(() => {
    select({ kind: "none" });
    setTool("select");
    fitted.current = false;
  }, [roomId, select, setTool]);

  const fit = useCallback(() => {
    if (!room || !size.width || !size.height) return;
    const b = polygonBounds(room.polygon);
    const margin = 80; // cm
    const scale = Math.min(size.width / (b.width + margin * 2), size.height / (b.height + margin * 2));
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    setView({
      scale: s,
      x: (size.width - b.width * s) / 2 - b.minX * s,
      y: (size.height - b.height * s) / 2 - b.minY * s,
    });
  }, [room, size.width, size.height]);

  useEffect(() => {
    if (fitted.current || !size.width) return;
    fit();
    fitted.current = true;
  }, [fit, size.width]);

  const zoomAt = useCallback(
    (factor: number, center?: { x: number; y: number }) => {
      setView((v) => {
        const c = center ?? { x: size.width / 2, y: size.height / 2 };
        const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
        const wx = (c.x - v.x) / v.scale;
        const wy = (c.y - v.y) / v.scale;
        return { scale: ns, x: c.x - wx * ns, y: c.y - wy * ns };
      });
    },
    [size.width, size.height],
  );

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const p = stage?.getPointerPosition();
    if (!p) return;
    zoomAt(e.evt.deltaY > 0 ? 1 / 1.08 : 1.08, p);
  };

  // ---- 폴리곤 변경 커밋 ----
  const commitPolygon = useCallback(
    (poly: Point[], nextOpenings?: Opening[]) => {
      if (!room) return;
      updateRoom(room.id, { polygon: poly, openings: clampOpenings(poly, nextOpenings ?? room.openings) });
    },
    [room, updateRoom],
  );

  const handleVertexDrag = (index: number, p: Point, free: boolean) => {
    if (!room) return;
    setDraftPolygon(moveVertex(room.polygon, index, p, !free));
  };
  const handleVertexDragEnd = () => {
    if (draftPolygon) commitPolygon(draftPolygon);
    setDraftPolygon(null);
  };

  const handleSetWallLength = (index: number, len: number) => {
    if (!room) return;
    commitPolygon(setWallLength(room.polygon, index, len));
  };

  const handleSetVertex = (index: number, p: Point) => {
    if (!room) return;
    commitPolygon(moveVertex(room.polygon, index, p, true));
  };

  const handleDeleteVertex = (index: number) => {
    if (!room || room.polygon.length <= 3) return;
    const next = removeVertex(room.polygon, index);
    commitPolygon(next, remapOpeningsAfterRemove(room.polygon, next, room.openings, index));
    select({ kind: "none" });
  };

  const addOpening = (type: OpeningType, wallIndex: number, offset?: number) => {
    if (!room) return;
    const len = wallLength(room.polygon, wallIndex);
    const width = Math.min(openingDefaults[type].width, len);
    const start = offset ?? (len - width) / 2;
    const o: Opening = {
      id: newId(),
      type,
      wallIndex,
      offset: Math.max(0, Math.min(len - width, snapValue(start))),
      width,
    };
    updateRoom(room.id, { openings: [...room.openings, o] });
    select({ kind: "opening", id: o.id });
    setTool("select");
  };

  const handleWallClick = (index: number, world: Point) => {
    if (tool === "door" || tool === "window") {
      if (!room) return;
      const { offset } = projectOnWall(room.polygon, index, world);
      addOpening(tool, index, offset - openingDefaults[tool].width / 2);
      return;
    }
    select({ kind: "wall", index });
  };

  const handleWallDblClick = (index: number, world: Point) => {
    if (!room) return;
    const { offset } = projectOnWall(room.polygon, index, world);
    const a = room.polygon[index];
    const b = room.polygon[(index + 1) % room.polygon.length];
    const len = wallLength(room.polygon, index);
    if (len < 20) return;
    const t = Math.max(10, Math.min(len - 10, snapValue(offset))) / len;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const next = insertVertex(room.polygon, index, snapPoint(p));
    commitPolygon(next, remapOpeningsAfterInsert(room.polygon, next, room.openings, index));
    select({ kind: "vertex", index: index + 1 });
  };

  const handleUpdateOpening = (id: string, patch: Partial<Opening>) => {
    if (!room) return;
    updateRoom(room.id, { openings: clampOpenings(room.polygon, room.openings.map((o) => (o.id === id ? { ...o, ...patch } : o))) });
  };
  const handleDeleteOpening = (id: string) => {
    if (!room) return;
    updateRoom(room.id, { openings: room.openings.filter((o) => o.id !== id) });
    select({ kind: "none" });
  };
  const handleOpeningDragEnd = () => {
    if (draftOpening) handleUpdateOpening(draftOpening.id, { offset: draftOpening.offset });
    setDraftOpening(null);
  };

  const handleAddFurniture = (type: FurnitureType) => {
    if (!room) return;
    const c = centroid(room.polygon);
    const def = FURNITURE_TYPE_LIST.find((d) => d.type === type)!;
    const n = furnitureList.length;
    const pos = snapPoint({ x: c.x - def.width / 2 + (n % 4) * 20, y: c.y - def.depth / 2 + (n % 4) * 20 });
    const f = addFurniture(room.id, type, pos);
    select({ kind: "furniture", id: f.id });
    setTool("select");
  };

  // ---- 키보드 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const mod = e.metaKey || e.ctrlKey;
      const temporal = useHomeStore.temporal.getState();
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        temporal.redo();
        return;
      }
      if (e.key === "Escape") {
        select({ kind: "none" });
        setTool("select");
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = useEditorUi.getState().selection;
        if (sel.kind === "opening") handleDeleteOpening(sel.id);
        else if (sel.kind === "vertex") handleDeleteVertex(sel.index);
        else if (sel.kind === "furniture") {
          const f = useHomeStore.getState().furniture[sel.id];
          if (f && confirm(`"${f.name}"과 칸·라벨을 삭제할까요?`)) {
            deleteFurnitureCascade(sel.id);
            select({ kind: "none" });
          }
        }
        return;
      }
      if (e.key.toLowerCase() === "r" && !mod) {
        const sel = useEditorUi.getState().selection;
        if (sel.kind === "furniture") {
          const f = useHomeStore.getState().furniture[sel.id];
          if (f) updateFurniture(sel.id, { rotation: rotateCw(f.rotation) });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  if (!room) return <div className="p-6 text-neutral-500">방을 찾을 수 없습니다.</div>;

  // 보이는 월드 영역 (격자용)
  const visible = {
    minX: -view.x / view.scale,
    minY: -view.y / view.scale,
    maxX: (size.width - view.x) / view.scale,
    maxY: (size.height - view.y) / view.scale,
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3rem-4rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex-1 flex flex-col min-h-[55vh] md:min-h-0">
        <EditorToolbar
          onFit={fit}
          onZoom={(f) => zoomAt(f)}
          extra={
            <label className="flex items-center gap-1 text-sm">
              <span className="text-neutral-500 hidden sm:inline">가구</span>
              <select
                className="input w-auto py-1"
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddFurniture(e.target.value as FurnitureType);
                }}
              >
                <option value="">+ 가구 추가</option>
                {FURNITURE_TYPE_LIST.map((d) => (
                  <option key={d.type} value={d.type}>
                    {d.label} ({d.width}×{d.depth})
                  </option>
                ))}
              </select>
            </label>
          }
        />
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-neutral-100 touch-none">
          {size.width > 0 && (
            <Stage
              ref={stageRef}
              width={size.width}
              height={size.height}
              scaleX={view.scale}
              scaleY={view.scale}
              x={view.x}
              y={view.y}
              draggable
              onWheel={onWheel}
              onDragEnd={(e) => {
                if (e.target === e.target.getStage()) setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
              }}
              onClick={(e) => {
                if (e.target === e.target.getStage()) select({ kind: "none" });
              }}
              onTap={(e) => {
                if (e.target === e.target.getStage()) select({ kind: "none" });
              }}
            >
              <GridLayer {...visible} scale={view.scale} />
              <RoomLayer
                polygon={polygon}
                openings={openings}
                scale={view.scale}
                tool={tool}
                selection={selection}
                onSelect={select}
                onVertexDrag={handleVertexDrag}
                onVertexDragEnd={handleVertexDragEnd}
                onWallClick={handleWallClick}
                onWallDblClick={handleWallDblClick}
                onOpeningDrag={(id, offset) => setDraftOpening({ id, offset })}
                onOpeningDragEnd={handleOpeningDragEnd}
              />
              <FurnitureLayer
                list={furnitureList}
                warnings={warnings}
                scale={view.scale}
                selection={selection}
                highlightId={highlight.furnitureId}
                onSelect={(id) => select({ kind: "furniture", id })}
                onOpenFront={(id) => {
                  select({ kind: "furniture", id });
                  openFrontView(id);
                }}
                onMove={(id, x, y) => updateFurniture(id, { x, y })}
                onResize={(id, patch) => updateFurniture(id, patch)}
              />
            </Stage>
          )}
          {tool !== "select" && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
              벽을 클릭해 {openingDefaults[tool].label}을 추가하세요 (Esc 취소)
            </div>
          )}
        </div>
      </div>
      <aside className="md:w-72 border-t md:border-t-0 md:border-l border-neutral-200 bg-white p-4 overflow-y-auto">
        {selection.kind === "furniture" && furnitureMap[selection.id] ? (
          <FurniturePanel furniture={furnitureMap[selection.id]} warning={warnings[selection.id]} furnitureNames={furnitureNames} />
        ) : (
        <SelectionPanel
          room={room}
          selection={selection}
          onSetWallLength={handleSetWallLength}
          onAddOpening={(type, wallIndex) => addOpening(type, wallIndex)}
          onUpdateOpening={handleUpdateOpening}
          onDeleteOpening={handleDeleteOpening}
          onSetVertex={handleSetVertex}
          onDeleteVertex={handleDeleteVertex}
        />
        )}
      </aside>
      {frontViewFurnitureId && furnitureMap[frontViewFurnitureId] && (
        <FurnitureFrontView
          furnitureId={frontViewFurnitureId}
          initialCompartmentId={highlight.furnitureId === frontViewFurnitureId ? highlight.compartmentId : null}
          onClose={() => openFrontView(null)}
        />
      )}
    </div>
  );
}
