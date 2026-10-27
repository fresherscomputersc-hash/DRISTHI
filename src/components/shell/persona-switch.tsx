"use client";

import { useTransition } from "react";
import { setPersona } from "@/app/actions/persona";
import { PERSONAS, type PersonaId } from "./nav-config";

export function PersonaSwitch({ persona }: { persona: string }) {
  const [pending, start] = useTransition();

  return (
    <label className="block">
      <span className="eyebrow text-sidebar-muted">Viewing as</span>
      <select
        aria-label="Switch persona"
        value={persona}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          start(() => {
            void setPersona(next);
          });
        }}
        className="mt-1.5 w-full appearance-none rounded border border-sidebar-border bg-white/[0.04] px-2 py-1.5 text-label text-sidebar-foreground outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id} className="bg-sidebar text-sidebar-foreground">
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}
