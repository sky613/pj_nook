"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CompartmentCard } from "@/components/find/CompartmentCard";
import { useHomeStore } from "@/store/homeStore";
import { locateCompartment } from "@/store/selectors";

/** 라벨 QR 착지 페이지. 데이터는 브라우저 저장소에 있으므로 같은 기기에서만 내용이 보인다. */
export default function CompartmentQrPage() {
  const { compartmentId } = useParams<{ compartmentId: string }>();
  const data = useHomeStore();
  const loc = locateCompartment(data, compartmentId);

  return (
    <div className="p-4 max-w-md mx-auto space-y-3">
      {loc ? (
        <CompartmentCard loc={loc} />
      ) : (
        <div className="card text-sm text-neutral-600 space-y-1">
          <div className="font-medium">이 기기에서 칸을 찾을 수 없습니다.</div>
          <div>데이터는 기기 브라우저에 저장됩니다. 라벨을 만든 기기에서 QR을 열거나, 설정에서 데이터를 가져오세요.</div>
        </div>
      )}
      <Link href="/find" className="block text-center text-sm text-blue-600 hover:underline">
        다른 물건 찾기 →
      </Link>
    </div>
  );
}
