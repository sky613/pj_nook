"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHomeStore } from "@/store/homeStore";

const RoomEditor = dynamic(() => import("@/components/editor/RoomEditor"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-neutral-400">에디터 불러오는 중…</div>,
});

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useHomeStore((s) => s.rooms[roomId]);
  const updateRoom = useHomeStore((s) => s.updateRoom);

  if (!room) {
    return (
      <div>
        <PageHeader title="방" back="/home" />
        <div className="p-6 text-neutral-500">방을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={room.name}
        back="/home"
        actions={
          <input
            className="input w-40 text-sm"
            value={room.name}
            onChange={(e) => updateRoom(room.id, { name: e.target.value })}
            aria-label="방 이름"
          />
        }
      />
      <RoomEditor roomId={roomId} />
    </div>
  );
}
