import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type * as React from "react";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiProps = {
  label: string;
  value: string;
  hint: string;
  href: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; good: boolean; label: string };
  spark?: number[];
  sparkColor?: string;
  badge?: { text: string; tone: "neutral" | "info" | "success" | "warning" | "danger" };
  accent?: boolean;
  className?: string;
};

export function KpiCard({
  label,
  value,
  hint,
  href,
  delta,
  spark,
  sparkColor,
  badge,
  accent,
  className,
}: KpiProps) {
  const DeltaIcon =
    delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-4 transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-[2px]",
          accent ? "bg-accent" : "bg-transparent",
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : null}
      </div>

      <p className="mt-2 text-metric font-bold tabular leading-none">{value}</p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {delta ? (
            <p
              className={cn(
                "flex items-center gap-1 text-label font-medium",
                delta.good ? "text-success" : "text-danger",
              )}
            >
              <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular">{delta.value}</span>
              <span className="font-normal text-muted-foreground">{delta.label}</span>
            </p>
          ) : null}
          <p className="mt-1 truncate text-label text-muted-foreground">{hint}</p>
        </div>
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} color={sparkColor ?? "hsl(var(--chart-1))"} />
        ) : null}
      </div>

      <Link href={href} className="absolute inset-0 rounded-lg" aria-label={`${label} — open module`}>
        <span className="sr-only">Open {label}</span>
      </Link>
    </Card>
  );
}
