import { cache } from "react";
import { reconcileAggregate } from "@/core/reconcile";
import type { CaseStatus, Channel, Detection, RevenueKind } from "@/core/types";
import { getSqlite, readMeta } from "@/db/client";
import { dbDateRange } from "./shared";

export type DetectedTrip = Detection & {
  serviceDate: string;
  departureTime: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  depotId: string;
  depotName: string;
  registration: string;
  capacity: number;
  distanceKm: number;
};

type CandidateRow = {
  trip_id: string;
  service_date: string;
  departure_time: string;
  status: "completed" | "cancelled" | "partial";
  route_id: string;
  route_code: string;
  route_name: string;
  depot_id: string;
  depot_name: string;
  registration: string;
  capacity: number;
  base_fare_per_km: number;
  distance_km: number;
  expected: number;
  collected: number;
  missing: number;
  channels: string | null;
  fare_gap: number;
  ticket_rows: number;
};

/**
 * One indexed pass produces only the trips that *could* be anomalous.
 * trip_finance is precomputed by the seed, so this is a 123k-row scan joined
 * on a primary key, not an aggregation over 500k+ detail rows.
 */
const CANDIDATE_SQL = `
SELECT
  tr.id              AS trip_id,
  tr.service_date    AS service_date,
  tr.departure_time  AS departure_time,
  tr.status          AS status,
  r.id               AS route_id,
  r.code             AS route_code,
  r.name             AS route_name,
  d.id               AS depot_id,
  d.name             AS depot_name,
  v.registration     AS registration,
  v.capacity         AS capacity,
  r.base_fare_per_km AS base_fare_per_km,
  COALESCE(tm.distance_km, tr.actual_km) AS distance_km,
  f.expected             AS expected,
  f.collected            AS collected,
  f.missing_remittance   AS missing,
  f.missing_channels     AS channels,
  f.fare_gap             AS fare_gap,
  f.ticket_rows          AS ticket_rows
FROM trips tr
JOIN trip_finance f ON f.trip_id = tr.id
JOIN routes r       ON r.id = tr.route_id
JOIN depots d       ON d.id = tr.depot_id
JOIN vehicles v     ON v.id = tr.vehicle_id
LEFT JOIN telemetry tm ON tm.trip_id = tr.id
WHERE tr.service_date BETWEEN ? AND ?
  AND (
        (f.ticket_rows = 0 AND COALESCE(tm.distance_km, tr.actual_km) > 5)
     OR f.missing_remittance > 25
     OR ABS(f.expected - f.collected) > 25
     OR f.fare_gap > 25
  )
ORDER BY f.expected DESC
`;

function toChannels(raw: string | null): Channel[] {
  if (!raw) return [];
  return raw.split(",").filter(Boolean) as Channel[];
}

function classify(row: CandidateRow): Detection | null {
  return reconcileAggregate({
    tripId: row.trip_id,
    status: row.status,
    hasTickets: row.ticket_rows > 0,
    expected: row.expected,
    collected: row.collected,
    missingRemittance: row.missing,
    missingChannels: toChannels(row.channels),
    fareGap: row.fare_gap,
    distanceKm: row.distance_km,
    capacity: row.capacity,
    baseFarePerKm: row.base_fare_per_km,
  });
}

function mapRow(row: CandidateRow, detection: Detection): DetectedTrip {
  return {
    ...detection,
    serviceDate: row.service_date,
    departureTime: row.departure_time,
    routeId: row.route_id,
    routeCode: row.route_code,
    routeName: row.route_name,
    depotId: row.depot_id,
    depotName: row.depot_name,
    registration: row.registration,
    capacity: row.capacity,
    distanceKm: row.distance_km,
  };
}

export type DetectionFilters = {
  days?: number;
  depotId?: string;
  kind?: RevenueKind | "all";
  query?: string;
  minImpact?: number;
};

/**
 * The dataset is immutable for the life of the process (cases are stored
 * separately), so reconciliation results are memoised per window.
 */
const memo = new Map<number, DetectedTrip[]>();

function computeWindow(days: number): DetectedTrip[] {
  const cached = memo.get(days);
  if (cached) return cached;

  const { start, end } = dbDateRange(days);
  const db = getSqlite();
  const rows = db.prepare(CANDIDATE_SQL).all(start, end) as CandidateRow[];

  const out: DetectedTrip[] = [];
  for (const row of rows) {
    const detection = classify(row);
    if (detection) out.push(mapRow(row, detection));
  }
  out.sort((a, b) => b.rupeesImpact - a.rupeesImpact);

  memo.set(days, out);
  return out;
}

export function filterDetections(rows: DetectedTrip[], filters: DetectionFilters): DetectedTrip[] {
  return rows.filter((row) => {
    if (filters.depotId && filters.depotId !== "all" && row.depotId !== filters.depotId) return false;
    if (filters.kind && filters.kind !== "all" && row.kind !== filters.kind) return false;
    if (filters.minImpact && row.rupeesImpact < filters.minImpact) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (
        !row.tripId.toLowerCase().includes(q) &&
        !row.routeCode.toLowerCase().includes(q) &&
        !row.routeName.toLowerCase().includes(q) &&
        !row.registration.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

export function getDetections(filters: DetectionFilters = {}): DetectedTrip[] {
  return filterDetections(computeWindow(filters.days ?? 30), filters);
}

export type RevenueSummary = {
  totalImpact: number;
  count: number;
  byKind: { kind: RevenueKind; count: number; impact: number }[];
  byDepot: { depotId: string; depotName: string; count: number; impact: number }[];
  daily: { date: string; impact: number; count: number }[];
};

export const getRevenueSummary = cache((days = 30): RevenueSummary => {
  const detections = computeWindow(days);

  const kindMap = new Map<RevenueKind, { count: number; impact: number }>();
  const depotMap = new Map<string, { depotName: string; count: number; impact: number }>();
  const dayMap = new Map<string, { impact: number; count: number }>();

  for (const d of detections) {
    const k = kindMap.get(d.kind) ?? { count: 0, impact: 0 };
    k.count += 1;
    k.impact += d.rupeesImpact;
    kindMap.set(d.kind, k);

    const dp = depotMap.get(d.depotId) ?? { depotName: d.depotName, count: 0, impact: 0 };
    dp.count += 1;
    dp.impact += d.rupeesImpact;
    depotMap.set(d.depotId, dp);

    const day = dayMap.get(d.serviceDate) ?? { impact: 0, count: 0 };
    day.impact += d.rupeesImpact;
    day.count += 1;
    dayMap.set(d.serviceDate, day);
  }

  return {
    totalImpact: detections.reduce((s, d) => s + d.rupeesImpact, 0),
    count: detections.length,
    byKind: Array.from(kindMap.entries())
      .map(([kind, v]) => ({ kind, ...v }))
      .sort((a, b) => b.impact - a.impact),
    byDepot: Array.from(depotMap.entries())
      .map(([depotId, v]) => ({ depotId, ...v }))
      .sort((a, b) => b.impact - a.impact),
    daily: Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
});

/* ------------------------------------------------------------------ */
/* Cases                                                               */
/* ------------------------------------------------------------------ */

export type CaseInfo = {
  id: number;
  status: CaseStatus;
  assignee: string | null;
  note: string | null;
  updatedAt: string;
};

export const caseKey = (tripId: string, kind: string) => `${tripId}:${kind}`;

/** Cases are read separately so detection memoisation stays valid. */
export const getCaseMap = cache((): Map<string, CaseInfo> => {
  const db = getSqlite();
  const rows = db
    .prepare("SELECT case_key, id, status, assignee, note, updated_at FROM cases")
    .all() as {
    case_key: string;
    id: number;
    status: CaseStatus;
    assignee: string | null;
    note: string | null;
    updated_at: string;
  }[];

  const map = new Map<string, CaseInfo>();
  for (const row of rows) {
    map.set(row.case_key, {
      id: row.id,
      status: row.status,
      assignee: row.assignee,
      note: row.note,
      updatedAt: row.updated_at,
    });
  }
  return map;
});

export const getOpenCaseCount = cache((): number => {
  const db = getSqlite();
  const row = db.prepare("SELECT COUNT(*) c FROM cases WHERE status <> 'resolved'").get() as {
    c: number;
  };
  return row.c;
});

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

export type TripEvidence = {
  trip: {
    id: string;
    serviceDate: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    scheduledKm: number;
    actualKm: number;
  };
  route: { id: string; code: string; name: string; distanceKm: number; depotName: string };
  vehicle: { id: string; registration: string; model: string; capacity: number };
  tickets: {
    channel: string;
    ticketsSold: number;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
  }[];
  collections: {
    channel: string;
    cashAmount: number;
    onlineAmount: number;
    remittedOn: string | null;
    syncStatus: string;
  }[];
  telemetry: {
    gpsPoints: number;
    distanceKm: number;
    avgSpeedKmph: number;
    idleMinutes: number;
    gpsGapMinutes: number;
    lastPing: string;
  } | null;
  detection: Detection | null;
  groundTruth: { kind: string; rupeesImpact: number; note: string | null } | null;
  caseRow: {
    id: number;
    status: CaseStatus;
    assignee: string | null;
    note: string | null;
    updatedAt: string;
  } | null;
};

export const getTripEvidence = cache((tripId: string): TripEvidence | null => {
  const db = getSqlite();
  const head = db
    .prepare(
      `SELECT tr.id, tr.service_date, tr.departure_time, tr.arrival_time, tr.status,
              tr.scheduled_km, tr.actual_km,
              r.id route_id, r.code route_code, r.name route_name, r.distance_km,
              r.base_fare_per_km,
              d.name depot_name,
              v.id vehicle_id, v.registration, v.model, v.capacity
       FROM trips tr
       JOIN routes r ON r.id = tr.route_id
       JOIN depots d ON d.id = tr.depot_id
       JOIN vehicles v ON v.id = tr.vehicle_id
       WHERE tr.id = ?`,
    )
    .get(tripId) as
    | {
        id: string;
        service_date: string;
        departure_time: string;
        arrival_time: string;
        status: string;
        scheduled_km: number;
        actual_km: number;
        route_id: string;
        route_code: string;
        route_name: string;
        distance_km: number;
        base_fare_per_km: number;
        depot_name: string;
        vehicle_id: string;
        registration: string;
        model: string;
        capacity: number;
      }
    | undefined;

  if (!head) return null;

  const ticketRows = db
    .prepare(
      `SELECT channel, tickets_sold, gross_amount, discount_amount, net_amount
       FROM tickets WHERE trip_id = ? ORDER BY channel`,
    )
    .all(tripId) as {
    channel: string;
    tickets_sold: number;
    gross_amount: number;
    discount_amount: number;
    net_amount: number;
  }[];

  const collectionRows = db
    .prepare(
      `SELECT channel, cash_amount, online_amount, remitted_on, sync_status
       FROM collections WHERE trip_id = ? ORDER BY channel`,
    )
    .all(tripId) as {
    channel: string;
    cash_amount: number;
    online_amount: number;
    remitted_on: string | null;
    sync_status: string;
  }[];

  const telemetryRow = db
    .prepare(
      `SELECT gps_points, distance_km, avg_speed_kmph, idle_minutes, gps_gap_minutes, last_ping
       FROM telemetry WHERE trip_id = ?`,
    )
    .get(tripId) as
    | {
        gps_points: number;
        distance_km: number;
        avg_speed_kmph: number;
        idle_minutes: number;
        gps_gap_minutes: number;
        last_ping: string;
      }
    | undefined;

  const groundTruth = db
    .prepare(
      "SELECT kind, rupees_impact, note FROM anomalies WHERE entity_id = ? AND entity_type = 'trip'",
    )
    .get(tripId) as { kind: string; rupees_impact: number; note: string | null } | undefined;

  const caseRow = db
    .prepare(
      `SELECT id, status, assignee, note, updated_at FROM cases
       WHERE trip_id = ? ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(tripId) as
    | { id: number; status: CaseStatus; assignee: string | null; note: string | null; updated_at: string }
    | undefined;

  const missingRows = ticketRows.filter(
    (t) => !collectionRows.some((c) => c.channel === t.channel),
  );

  const detection = reconcileAggregate({
    tripId,
    status: head.status as "completed" | "cancelled" | "partial",
    hasTickets: ticketRows.length > 0,
    expected: ticketRows.reduce((s, r) => s + r.net_amount, 0),
    collected: collectionRows.reduce((s, r) => s + r.cash_amount + r.online_amount, 0),
    missingRemittance: missingRows.reduce((s, t) => s + t.net_amount, 0),
    missingChannels: missingRows.map((t) => t.channel) as Channel[],
    fareGap: ticketRows.reduce((s, t) => {
      const gap = t.gross_amount - t.discount_amount - t.net_amount;
      return gap > 1 ? s + gap : s;
    }, 0),
    distanceKm: telemetryRow?.distance_km ?? head.actual_km,
    capacity: head.capacity,
    baseFarePerKm: head.base_fare_per_km,
  });

  return {
    trip: {
      id: head.id,
      serviceDate: head.service_date,
      departureTime: head.departure_time,
      arrivalTime: head.arrival_time,
      status: head.status,
      scheduledKm: head.scheduled_km,
      actualKm: head.actual_km,
    },
    route: {
      id: head.route_id,
      code: head.route_code,
      name: head.route_name,
      distanceKm: head.distance_km,
      depotName: head.depot_name,
    },
    vehicle: {
      id: head.vehicle_id,
      registration: head.registration,
      model: head.model,
      capacity: head.capacity,
    },
    tickets: ticketRows.map((r) => ({
      channel: r.channel,
      ticketsSold: r.tickets_sold,
      grossAmount: r.gross_amount,
      discountAmount: r.discount_amount,
      netAmount: r.net_amount,
    })),
    collections: collectionRows.map((r) => ({
      channel: r.channel,
      cashAmount: r.cash_amount,
      onlineAmount: r.online_amount,
      remittedOn: r.remitted_on,
      syncStatus: r.sync_status,
    })),
    telemetry: telemetryRow
      ? {
          gpsPoints: telemetryRow.gps_points,
          distanceKm: telemetryRow.distance_km,
          avgSpeedKmph: telemetryRow.avg_speed_kmph,
          idleMinutes: telemetryRow.idle_minutes,
          gpsGapMinutes: telemetryRow.gps_gap_minutes,
          lastPing: telemetryRow.last_ping,
        }
      : null,
    detection,
    groundTruth: groundTruth
      ? { kind: groundTruth.kind, rupeesImpact: groundTruth.rupees_impact, note: groundTruth.note }
      : null,
    caseRow: caseRow
      ? {
          id: caseRow.id,
          status: caseRow.status,
          assignee: caseRow.assignee,
          note: caseRow.note,
          updatedAt: caseRow.updated_at,
        }
      : null,
  };
});

export const getDepotOptions = cache(() => {
  const db = getSqlite();
  return db.prepare("SELECT id, name FROM depots ORDER BY name").all() as {
    id: string;
    name: string;
  }[];
});

export const getScorecardForWindow = cache((days = 90) => {
  const detections = computeWindow(days);
  const db = getSqlite();
  const { start, end } = dbDateRange(days);
  const truth = db
    .prepare(
      `SELECT entity_id AS entityId, kind, rupees_impact AS rupeesImpact
       FROM anomalies
       WHERE entity_type = 'trip'
         AND kind IN ('ETM_SYNC_FAILURE','UNDER_COLLECTION','DUPLICATE_SALE','FARE_MISMATCH','UNRECORDED_TRIP')
         AND injected_on BETWEEN ? AND ?`,
    )
    .all(start, end) as { entityId: string; kind: string; rupeesImpact: number }[];

  return { detections, truth };
});

export function freshness() {
  return {
    etm: readMeta("source_etm") ?? "",
    oprs: readMeta("source_oprs") ?? "",
    gps: readMeta("source_gps") ?? "",
    maintenance: readMeta("source_maintenance") ?? "",
    generatedAt: readMeta("generated_at") ?? "",
  };
}
