"use client";

import { useEffect, useState } from "react";
import type { Opening, OpeningType, Point, Room } from "@/lib/types";
import { polygonArea, wallLength } from "@/lib/geometry/polygon";
import { useEditorUi, openingDefaults, type Selection } from "@/store/editorUiStore";

interface Props {
  room: Room;
  selection: Selection;
  onSetWallLength: (index: number, len: number) => void;
  onAddOpening: (type: OpeningType, wallIndex: number) => void;
  onUpdateOpening: (id: string, patch: Partial<Opening>) => void;
  onDeleteOpening: (id: string) => void;
  onSetVertex: (index: number, p: Point) => void;
  onDeleteVertex: (index: number) => void;
}

function NumberField({ label, value, onCommit, min, step = 10, suffix = "cm" }: { label: string; value: number; onCommit: (v: number) => void; min?: number; step?: number; suffix?: string }) {
  const [text, setText] = useState(String(Math.round(value)));
  useEffect(() => setText(String(Math.round(value))), [value]);
  const commit = () => {
    const v = Number(text);
    if (!Number.isFinite(v)) return setText(String(Math.round(value)));
    if (min !== undefined && v < min) return setText(String(Math.round(value)));
    onCommit(v);
  };
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="flex items-center gap-1">
        <input
          className="input"
          type="number"
          step={step}
          min={min}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <span className="text-xs text-neutral-500 w-6">{suffix}</span>
      </span>
    </label>
  );
}

export function SelectionPanel(props: Props) {
  const { room, selection } = props;
  const select = useEditorUi((s) => s.select);
  const area = polygonArea(room.polygon) / 10000; // m²

  if (selection.kind === "wall") {
    const len = wallLength(room.polygon, selection.index);
    return (
      <div className="space-y-3">
        <h3 className="font-medium">벽 {selection.index + 1}</h3>
        <NumberField label="길이" value={len} min={10} onCommit={(v) => props.onSetWallLength(selection.index, v)} />
        <p className="text-xs text-neutral-500">길이를 바꾸면 끝 꼭짓점이 이동하고 직각이 유지됩니다.</p>
        <div className="flex gap-2">
          <button className="btn" onClick={() => props.onAddOpening("door", selection.index)}>
            🚪 문 추가
          </button>
          <button className="btn" onClick={() => props.onAddOpening("window", selection.index)}>
            🪟 창문 추가
          </button>
        </div>
      </div>
    );
  }

  if (selection.kind === "vertex") {
    const p = room.polygon[selection.index];
    if (!p) return null;
    return (
      <div className="space-y-3">
        <h3 className="font-medium">꼭짓점 {selection.index + 1}</h3>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={p.x} onCommit={(v) => props.onSetVertex(selection.index, { x: v, y: p.y })} />
          <NumberField label="Y" value={p.y} onCommit={(v) => props.onSetVertex(selection.index, { x: p.x, y: v })} />
        </div>
        <p className="text-xs text-neutral-500">드래그하면 10cm 격자에 맞춰지고 직각이 유지됩니다. Alt 를 누르면 자유 이동.</p>
        <button className="btn btn-danger" disabled={room.polygon.length <= 3} onClick={() => props.onDeleteVertex(selection.index)}>
          꼭짓점 삭제
        </button>
      </div>
    );
  }

  if (selection.kind === "opening") {
    const o = room.openings.find((x) => x.id === selection.id);
    if (!o) return null;
    const len = wallLength(room.polygon, o.wallIndex);
    return (
      <div className="space-y-3">
        <h3 className="font-medium">{openingDefaults[o.type].label}</h3>
        <label className="block">
          <span className="label">종류</span>
          <select className="input" value={o.type} onChange={(e) => props.onUpdateOpening(o.id, { type: e.target.value as OpeningType })}>
            <option value="door">문</option>
            <option value="window">창문</option>
          </select>
        </label>
        <label className="block">
          <span className="label">벽</span>
          <select className="input" value={o.wallIndex} onChange={(e) => props.onUpdateOpening(o.id, { wallIndex: Number(e.target.value), offset: 0 })}>
            {room.polygon.map((_, i) => (
              <option key={i} value={i}>
                벽 {i + 1} ({Math.round(wallLength(room.polygon, i))} cm)
              </option>
            ))}
          </select>
        </label>
        <NumberField label="시작 위치" value={o.offset} min={0} onCommit={(v) => props.onUpdateOpening(o.id, { offset: Math.min(v, Math.max(0, len - o.width)) })} />
        <NumberField label="너비" value={o.width} min={10} onCommit={(v) => props.onUpdateOpening(o.id, { width: Math.min(v, len) })} />
        <button className="btn btn-danger" onClick={() => props.onDeleteOpening(o.id)}>
          삭제
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-medium">{room.name}</h3>
      <dl className="grid grid-cols-2 gap-y-1 text-neutral-600">
        <dt>면적</dt>
        <dd className="text-right">{area.toFixed(1)} m²</dd>
        <dt>벽</dt>
        <dd className="text-right">{room.polygon.length}개</dd>
        <dt>문/창문</dt>
        <dd className="text-right">{room.openings.length}개</dd>
      </dl>
      <ul className="text-xs text-neutral-500 space-y-1 list-disc pl-4">
        <li>벽을 클릭해 길이를 입력하세요.</li>
        <li>꼭짓점을 드래그해 모양을 바꾸세요 (10cm 스냅).</li>
        <li>벽을 더블클릭하면 꼭짓점이 추가됩니다.</li>
        <li>휠로 확대/축소, 빈 곳을 드래그해 이동.</li>
        <li>Ctrl+Z / Ctrl+Shift+Z 로 실행 취소 / 다시 실행.</li>
      </ul>
      <button className="btn text-xs" onClick={() => select({ kind: "none" })}>
        선택 해제
      </button>
    </div>
  );
}
