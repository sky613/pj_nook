"use client";

import { useState } from "react";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

/** 물건 목록 태그 입력: Enter / 쉼표로 추가, Backspace 로 마지막 삭제 */
export function TagInput({ value, onChange, placeholder = "물건 입력 후 Enter" }: Props) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const items = raw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s));
    if (items.length) onChange([...value, ...items]);
    setText("");
  };
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
      {value.map((item) => (
        <span key={item} className="badge bg-neutral-100 text-neutral-700 gap-1">
          {item}
          <button type="button" className="text-neutral-400 hover:text-red-600" onClick={() => onChange(value.filter((v) => v !== item))} aria-label={`${item} 삭제`}>
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24 text-sm outline-none bg-transparent"
        value={text}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => text.trim() && add(text)}
      />
    </div>
  );
}
