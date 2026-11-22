"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "우리 집", icon: "🏠" },
  { href: "/labels", label: "라벨", icon: "🏷️" },
  { href: "/find", label: "찾기", icon: "🔍" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed z-40 bg-white border-neutral-200
        bottom-0 left-0 right-0 h-16 border-t flex
        md:top-0 md:bottom-0 md:right-auto md:w-20 md:h-auto md:border-t-0 md:border-r md:flex-col md:pt-4"
      aria-label="주요 탭"
    >
      <div className="hidden md:block text-center text-xs font-bold text-neutral-500 mb-4">방라벨</div>
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 md:flex-none flex flex-col items-center justify-center gap-0.5 py-2 text-xs
              ${active ? "text-blue-600 font-semibold" : "text-neutral-500 hover:text-neutral-800"}`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
