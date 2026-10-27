"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, fmtDate } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";

export function Topbar({ windowEnd, persona }: { windowEnd: string; persona: string }) {
  const pathname = usePathname();
  const current =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight">
            {current.label}
          </h1>
          <p className="hidden truncate text-label text-muted-foreground sm:block">
            {current.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-label text-muted-foreground md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Data through {fmtDate(windowEnd)}
          </span>
          <span className="hidden rounded border border-warning/30 bg-warning-subtle px-2 py-1 text-micro font-medium uppercase tracking-[0.06em] text-warning sm:inline-block">
            Synthetic
          </span>
          <span className="rounded border border-border bg-card px-2 py-1 text-label capitalize text-muted-foreground">
            {persona}
          </span>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-border/70 px-2 py-1.5 scrollbar-thin lg:hidden"
        aria-label="Modules"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded px-2.5 py-1 text-label transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
