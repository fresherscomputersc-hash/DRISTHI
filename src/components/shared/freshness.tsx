import { cn } from "@/lib/utils";

export type FreshnessData = {
  etm: string;
  oprs: string;
  gps: string;
  maintenance: string;
  generatedAt: string;
};

const SOURCES = [
  { key: "etm" as const, label: "ETM ticketing", cadence: "batch · 4 h" },
  { key: "oprs" as const, label: "OPRS bookings", cadence: "near-real-time" },
  { key: "gps" as const, label: "Vehicle telemetry", cadence: "stream · 10 min" },
  { key: "maintenance" as const, label: "Workshop log", cadence: "manual · daily" },
];

function ageMinutes(nowIso: string, thenIso: string): number | null {
  const now = Date.parse(nowIso);
  const then = Date.parse(thenIso);
  if (Number.isNaN(now) || Number.isNaN(then)) return null;
  return Math.max(0, (now - then) / 60000);
}

function ageLabel(minutes: number | null): string {
  if (minutes === null) return "unknown";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)} h ago`;
  return `${(minutes / 1440).toFixed(1)} d ago`;
}

function tone(minutes: number | null): { dot: string; text: string } {
  if (minutes === null) return { dot: "bg-muted-foreground", text: "text-muted-foreground" };
  if (minutes <= 30) return { dot: "bg-success", text: "text-foreground" };
  if (minutes <= 240) return { dot: "bg-accent", text: "text-foreground" };
  if (minutes <= 1440) return { dot: "bg-warning", text: "text-warning" };
  return { dot: "bg-danger", text: "text-danger" };
}

export function FreshnessStrip({ data, className }: { data: FreshnessData; className?: string }) {
  return (
    <ul className={cn("grid gap-x-4 gap-y-2 sm:grid-cols-2", className)}>
      {SOURCES.map((source) => {
        const minutes = ageMinutes(data.generatedAt, data[source.key]);
        const t = tone(minutes);
        return (
          <li key={source.key} className="flex items-start gap-2">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} aria-hidden />
            <span className="min-w-0">
              <span className="block text-label font-medium leading-4">{source.label}</span>
              <span className={cn("block text-micro leading-4", t.text)}>
                {ageLabel(minutes)}
                <span className="text-muted-foreground"> · {source.cadence}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
