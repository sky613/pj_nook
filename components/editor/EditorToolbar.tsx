"use client";

import { useStore } from "zustand";
import { useHomeStore } from "@/store/homeStore";
import { useEditorUi, type EditorTool } from "@/store/editorUiStore";
import type { ReactNode } from "react";

interface Props {
  onFit: () => void;
  onZoom: (factor: number) => void;
  extra?: ReactNode;
}

const TOOLS: { id: EditorTool; label: string; icon: string; hint: string }[] = [
  { id: "select", label: "선택", icon: "↖", hint: "선택 / 이동 (Esc)" },
  { id: "door", label: "문", icon: "🚪", hint: "벽을 클릭해 문 추가" },
  { id: "window", label: "창문", icon: "🪟", hint: "벽을 클릭해 창문 추가" },
];

export function EditorToolbar({ onFit, onZoom, extra }: Props) {
  const tool = useEditorUi((s) => s.tool);
  const setTool = useEditorUi((s) => s.setTool);
  const canUndo = useStore(useHomeStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useHomeStore.temporal, (s) => s.futureStates.length > 0);
  const { undo, redo } = useHomeStore.temporal.getState();

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-neutral-200 bg-white text-sm">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={t.hint}
          className={`btn px-2 ${tool === t.id ? "btn-primary" : ""}`}
          onClick={() => setTool(t.id)}
        >
          <span>{t.icon}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
      <span className="w-px h-6 bg-neutral-200 mx-1" />
      {extra}
      <span className="flex-1" />
      <button className="btn px-2" title="실행 취소 (Ctrl+Z)" disabled={!canUndo} onClick={() => undo()}>
        ↶
      </button>
      <button className="btn px-2" title="다시 실행 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => redo()}>
        ↷
      </button>
      <span className="w-px h-6 bg-neutral-200 mx-1" />
      <button className="btn px-2" title="축소" onClick={() => onZoom(1 / 1.25)}>
        −
      </button>
      <button className="btn px-2" title="확대" onClick={() => onZoom(1.25)}>
        +
      </button>
      <button className="btn px-2" title="화면 맞춤" onClick={onFit}>
        ⛶
      </button>
    </div>
  );
}
