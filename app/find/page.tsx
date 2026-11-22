"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompartmentCard } from "@/components/find/CompartmentCard";
import { useHomeStore } from "@/store/homeStore";
import { useEditorUi } from "@/store/editorUiStore";
import { locateCompartment, searchCompartments } from "@/store/selectors";

export default function FindPage() {
  const data = useHomeStore();
  const [query, setQuery] = useState("");
  // 라벨 편집 화면의 "칸 내용 수정하러 가기"에서 넘어온 칸
  const highlightId = useEditorUi((s) => s.highlight.compartmentId);
  const focused = highlightId ? locateCompartment(data, highlightId) : null;
  const results = searchCompartments(data, query);

  return (
    <div>
      <PageHeader title="찾기" />
      <div className="p-4 max-w-3xl mx-auto space-y-3">
        <input
          className="input text-base"
          type="search"
          placeholder="물건, 칸, 가구, 방 이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="검색어"
        />
        {!query.trim() && focused && <CompartmentCard loc={focused} />}
        {!query.trim() && !focused && <p className="text-sm text-neutral-500">찾을 물건 이름을 입력하세요.</p>}
        {query.trim() && results.length === 0 && <p className="text-sm text-neutral-500">“{query.trim()}”을(를) 찾지 못했습니다.</p>}
        {results.map((loc) => (
          <CompartmentCard key={loc.compartment.id} loc={loc} query={query} />
        ))}
      </div>
    </div>
  );
}
