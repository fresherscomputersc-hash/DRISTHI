"use client";

import { ScanEye } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { PersonaSwitch } from "./persona-switch";

export function Sidebar({ persona }: { persona: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 px-4 pb-5 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 ring-1 ring-accent/30">
          <ScanEye className="h-5 w-5 text-accent" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-none tracking-tight">Drishti</p>
          <p className="mt-1 truncate text-[10px] uppercase tracking-[0.13em] text-sidebar-muted">
            OSRTC · Operations Intel
          </p>
        </div>
      </div>

      <nav className="flex-1 px-2" aria-label="Modules">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-sidebar-muted">
          Modules
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded px-2 py-2 text-label transition-colors",
                    active
                      ? "bg-white/[0.07] font-semibold text-white"
                      : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-full bg-accent transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-accent" : "text-sidebar-muted group-hover:text-sidebar-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-4 border-t border-sidebar-border px-4 py-4">
        <PersonaSwitch persona={persona} />
        <div className="space-y-1 border-t border-sidebar-border pt-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
            Synthetic dataset
          </p>
          <p className="text-[11px] leading-4 text-sidebar-muted">
            OSRTC-plausible scale, seeded with labelled anomalies. Not live OSRTC data.
          </p>
        </div>
      </div>
    </aside>
  );
}
