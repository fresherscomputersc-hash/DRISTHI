import Link from "next/link";
import { X } from "lucide-react";
import type * as React from "react";

export function Drawer({
  closeHref,
  title,
  subtitle,
  children,
}: {
  closeHref: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <Link
        href={closeHref}
        aria-label="Close panel"
        className="absolute inset-0 animate-fade-in bg-slate-950/25"
        tabIndex={-1}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[640px] animate-slide-in flex-col border-l border-border bg-card shadow-drawer">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            <p className="eyebrow">Evidence</p>
            <h2 className="truncate text-title font-bold">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-label text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Link
            href={closeHref}
            aria-label="Close"
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
