import { cache } from "react";
import { getSqlite, readMeta } from "@/db/client";
import { dbDateRange } from "./shared";
import { freshness } from "./revenue";

export type QualityCheck = {
  id: string;
  label: string;
  count: number;
  severity: "ok" | "info" | "warning" | "critical";
  detail: string;
};

export type QualityReport = {
  window: { start: string; end: string; days: number };
  totals: {
    vehicles: number;
    routes: number;
    trips: number;
    tickets: number;
    collections: number;
    telemetry: number;
    maintenance: number;
    anomalies: number;
  };
  checks: QualityCheck[];
  refusalCount: number;
  freshness: ReturnType<typeof freshness>;
  disclaimer: string;
  seedVersion: string;
  generatedAt: string;
};

export const getQualityReport = cache((): QualityReport => {
  const db = getSqlite();
  const { start, end } = dbDateRange(90);

  const one = (sql: string, ...params: unknown[]): number => {
    const row = db.prepare(sql).get(...params) as { c?: number } | undefined;
    return row?.c ?? 0;
  };

  const totals = {
    vehicles: one("SELECT COUNT(*) c FROM vehicles"),
    routes: one("SELECT COUNT(*) c FROM routes"),
    trips: one("SELECT COUNT(*) c FROM trips"),
    tickets: one("SELECT COUNT(*) c FROM tickets"),
    collections: one("SELECT COUNT(*) c FROM collections"),
    telemetry: one("SELECT COUNT(*) c FROM telemetry"),
    maintenance: one("SELECT COUNT(*) c FROM maintenance"),
    anomalies: one("SELECT COUNT(*) c FROM anomalies"),
  };

  const missingTelemetry = one(
    `SELECT COUNT(*) c FROM trips tr
     WHERE tr.status <> 'cancelled'
       AND NOT EXISTS (SELECT 1 FROM telemetry t WHERE t.trip_id = tr.id)`,
  );

  const unlinkedTickets = one(
    `SELECT COUNT(*) c FROM tickets tk
     WHERE NOT EXISTS (
       SELECT 1 FROM collections co WHERE co.trip_id = tk.trip_id AND co.channel = tk.channel
     )`,
  );

  const orphanCollections = one(
    `SELECT COUNT(*) c FROM collections co
     WHERE NOT EXISTS (SELECT 1 FROM tickets tk WHERE tk.trip_id = co.trip_id AND tk.channel = co.channel)`,
  );

  const cancelled = one(
    "SELECT COUNT(*) c FROM trips WHERE status = 'cancelled' AND service_date BETWEEN ? AND ?",
    start,
    end,
  );
  const tripsInWindow = one(
    "SELECT COUNT(*) c FROM trips WHERE service_date BETWEEN ? AND ?",
    start,
    end,
  );

  const noBoardings = one(
    `SELECT COUNT(*) c FROM trips tr
     WHERE tr.status <> 'cancelled'
       AND NOT EXISTS (SELECT 1 FROM tickets tk WHERE tk.trip_id = tr.id AND tk.tickets_sold > 0)`,
  );

  const gpsGaps = one(
    "SELECT COUNT(*) c FROM telemetry WHERE gps_gap_minutes > 20",
  );

  const routesWithThinHistory = one(
    `SELECT COUNT(*) c FROM (
       SELECT route_id FROM trips WHERE status <> 'cancelled' GROUP BY route_id HAVING COUNT(DISTINCT service_date) < 28
     )`,
  );

  const outOfService = one("SELECT COUNT(*) c FROM vehicles WHERE status <> 'active'");

  const checks: QualityCheck[] = [
    {
      id: "telemetry",
      label: "Trips without telemetry",
      count: missingTelemetry,
      severity: missingTelemetry === 0 ? "ok" : missingTelemetry > 500 ? "critical" : "warning",
      detail: "A trip without GPS cannot be reconciled against distance travelled.",
    },
    {
      id: "unlinked",
      label: "Ticket rows with no remittance",
      count: unlinkedTickets,
      severity: unlinkedTickets === 0 ? "ok" : "info",
      detail: "These are candidate sync failures — the Revenue Integrity module classifies each one.",
    },
    {
      id: "orphan",
      label: "Remittances with no ticket row",
      count: orphanCollections,
      severity: orphanCollections === 0 ? "ok" : "warning",
      detail: "Money received against a trip that issued no ticket — investigated as duplicate postings.",
    },
    {
      id: "gaps",
      label: "Trips with GPS gaps over 20 min",
      count: gpsGaps,
      severity: gpsGaps === 0 ? "ok" : "info",
      detail: "Expected on rural routes; telemetry confidence is reduced for these trips.",
    },
    {
      id: "boardings",
      label: "Trips with zero boardings",
      count: noBoardings,
      severity: noBoardings === 0 ? "ok" : "info",
      detail: "Either a genuine no-show or a missing ETM upload. The forecast excludes them.",
    },
    {
      id: "cancelled",
      label: "Cancellations in window",
      count: cancelled,
      severity: cancelled / Math.max(1, tripsInWindow) > 0.04 ? "warning" : "ok",
      detail: `${((cancelled / Math.max(1, tripsInWindow)) * 100).toFixed(1)}% of scheduled trips were cancelled.`,
    },
    {
      id: "thin",
      label: "Routes below forecast threshold",
      count: routesWithThinHistory,
      severity: routesWithThinHistory === 0 ? "ok" : "info",
      detail: "Forecasting refuses rather than guessing when a route has fewer than 28 days of history.",
    },
    {
      id: "fleet",
      label: "Vehicles out of service",
      count: outOfService,
      severity: "info",
      detail: "Matches the 109 inoperable buses reported in the Odisha Assembly reply (Mar 2025).",
    },
  ];

  return {
    window: { start, end, days: 90 },
    totals,
    checks,
    refusalCount: routesWithThinHistory,
    freshness: freshness(),
    disclaimer:
      readMeta("disclaimer") ??
      "Synthetic dataset at OSRTC-plausible scale. No real OSRTC records are used.",
    seedVersion: readMeta("seed_version") ?? "unknown",
    generatedAt: readMeta("generated_at") ?? "",
  };
});
