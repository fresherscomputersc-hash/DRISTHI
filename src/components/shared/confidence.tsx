import { clamp } from "@/lib/utils";

export function Confidence({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const pct = Math.round(clamp(value, 0, 1) * 100);
  const tone = pct >= 85 ? "bg-success" : pct >= 70 ? "bg-accent" : "bg-warning";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className={`block h-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      {showLabel ? <span className="tabular text-label text-muted-foreground">{pct}%</span> : null}
      <span className="sr-only">Confidence {pct} percent</span>
    </span>
  );
}
