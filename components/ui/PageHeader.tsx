import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({ title, back, actions }: { title: string; back?: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200 px-4 h-12 flex items-center gap-3">
      {back && (
        <Link href={back} className="text-neutral-500 hover:text-neutral-900" aria-label="뒤로">
          ←
        </Link>
      )}
      <h1 className="font-semibold text-base flex-1 truncate">{title}</h1>
      {actions}
    </header>
  );
}
