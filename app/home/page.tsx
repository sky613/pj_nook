"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHomeStore } from "@/store/homeStore";
import { roomsSorted, furnitureOf } from "@/store/selectors";
import { ROOM_TEMPLATES, templatePolygon, type RoomTemplate } from "@/lib/geometry/templates";
import { deleteRoomCascade } from "@/store/actions";

export default function HomePage() {
  const router = useRouter();
  const home = useHomeStore((s) => s.home);
  const setHomeName = useHomeStore((s) => s.setHomeName);
  const addRoom = useHomeStore((s) => s.addRoom);
  const data = useHomeStore();
  const rooms = roomsSorted(data);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<RoomTemplate>("rect");

  const onAdd = () => {
    const room = addRoom(name.trim() || `방 ${rooms.length + 1}`, templatePolygon(template));
    setName("");
    router.push(`/home/rooms/${room.id}`);
  };

  return (
    <div>
      <PageHeader title="우리 집" />
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="card flex items-center gap-2">
          <label className="text-sm text-neutral-600 shrink-0">집 이름</label>
          <input className="input" value={home.name} onChange={(e) => setHomeName(e.target.value)} />
        </div>

        <div className="card space-y-2">
          <div className="font-medium text-sm">방 추가</div>
          <div className="flex flex-wrap gap-2">
            <input
              className="input flex-1 min-w-40"
              placeholder="방 이름 (예: 거실)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAdd()}
            />
            <select className="input w-auto" value={template} onChange={(e) => setTemplate(e.target.value as RoomTemplate)}>
              {ROOM_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={onAdd}>
              추가
            </button>
          </div>
        </div>

        {rooms.length === 0 && <p className="text-sm text-neutral-500">아직 방이 없습니다. 위에서 방을 추가하세요.</p>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => {
            const furn = furnitureOf(data, room.id);
            const compCount = furn.reduce((n, f) => n + f.rows * f.cols, 0);
            return (
              <li key={room.id} className="card flex items-center justify-between gap-2">
                <Link href={`/home/rooms/${room.id}`} className="flex-1 min-w-0">
                  <div className="font-medium truncate">{room.name}</div>
                  <div className="text-xs text-neutral-500">
                    가구 {furn.length}개 · 칸 {compCount}개
                  </div>
                </Link>
                <button
                  className="btn btn-danger text-xs"
                  onClick={() => confirm(`"${room.name}" 방과 가구·칸·라벨을 모두 삭제할까요?`) && deleteRoomCascade(room.id)}
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
