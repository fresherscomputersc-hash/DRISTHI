import { addDays } from "@/lib/utils";
import { readMeta } from "@/db/client";

/** The dataset's "today" — never the wall clock, so the demo is deterministic. */
export function dataWindowEnd(): string {
  return readMeta("window_end") ?? "2026-10-25";
}

export function dataWindowStart(): string {
  return readMeta("window_start") ?? "2026-07-28";
}

export function dbDateRange(days: number): { start: string; end: string } {
  const end = dataWindowEnd();
  return { start: addDays(end, -(days - 1)), end };
}

export function latestServiceDate(): string {
  const { end } = dbDateRange(1);
  return end;
}
