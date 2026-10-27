import { Badge } from "@/components/ui/badge";
import type { RevenueKind } from "@/core/types";
import { REVENUE_KIND_LABEL } from "@/core/types";

const TONE: Record<RevenueKind, "danger" | "warning" | "info" | "neutral"> = {
  ETM_SYNC_FAILURE: "danger",
  UNDER_COLLECTION: "danger",
  UNRECORDED_TRIP: "warning",
  DUPLICATE_SALE: "warning",
  FARE_MISMATCH: "info",
};

export function KindBadge({ kind, short = false }: { kind: RevenueKind; short?: boolean }) {
  const label = REVENUE_KIND_LABEL[kind] ?? kind;
  return <Badge tone={TONE[kind] ?? "neutral"}>{short ? kind.replaceAll("_", " ").toLowerCase() : label}</Badge>;
}
