"use client";

import { useRouter } from "next/navigation";
import { useEditorUi } from "@/store/editorUiStore";
import { locationText, type CompartmentLocation } from "@/store/selectors";

/** 칸 위치·물건 표시 + 방 에디터 정면도로 이동 */
export function CompartmentCard({ loc, query = "" }: { loc: CompartmentLocation; query?: string }) {
  const router = useRouter();
  const setHighlight = useEditorUi((s) => s.setHighlight);
  const openFrontView = useEditorUi((s) => s.openFrontView);
  const { room, furniture, compartment: c } = loc;
  const q = query.trim().toLowerCase();

  const open = () => {
    setHighlight(furniture.id, c.id);
    openFrontView(furniture.id);
    router.push(`/home/rooms/${room.id}`);
  };

  return (
    <div className="card flex items-start gap-3">
      <div className="w-10 h-10 shrink-0 rounded-md flex items-center justify-center text-xl" style={{ background: c.color }}>
        {c.icon}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="font-medium">{c.name}</div>
        <div className="text-xs text-neutral-500">{locationText(loc)}</div>
        <div className="flex flex-wrap gap-1">
          {c.items.length === 0 && <span className="text-xs text-neutral-400">물건 없음</span>}
          {c.items.map((it) => (
            <span key={it} className={`badge ${q && it.toLowerCase().includes(q) ? "bg-amber-200 text-amber-900" : "bg-neutral-100 text-neutral-700"}`}>
              {it}
            </span>
          ))}
        </div>
      </div>
      <button className="btn shrink-0" onClick={open}>
        위치 보기
      </button>
    </div>
  );
}
