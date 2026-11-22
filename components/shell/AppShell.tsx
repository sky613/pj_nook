"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TabNav } from "./TabNav";
import { useHydrated } from "@/store/hydration";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const bare = pathname.startsWith("/c/"); // QR 상세는 탭 없이 모바일 우선
  if (!hydrated) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">불러오는 중…</div>;
  }
  if (bare) return <main className="min-h-screen">{children}</main>;
  return (
    <>
      <TabNav />
      <main className="min-h-screen pb-20 md:pb-0 md:pl-20">{children}</main>
    </>
  );
}
