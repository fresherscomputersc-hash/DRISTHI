import { cache } from "react";
import { riskScore, utilization, type RiskResult } from "@/core/risk";
import { getSqlite } from "@/db/client";
import { dbDateRange } from "./shared";

export type VehicleRiskRow = RiskResult & {
  registration: string;
  model: string;
  depotId: string;
  depotName: string;
  status: "active" | "maintenance" | "idle";
  capacity: number;
  odometerKm: number;
  lastServiceKm: number;
  serviceIntervalKm: number;
  ageYears: number;
  lastEventDate: string | null;
};

type RiskQueryRow = {
  id: string;
  registration: string;
  model: string;
  depot_id: string;
  depot_name: string;
  status: "active" | "maintenance" | "idle";
  capacity: number;
  age_years: number;
  odometer_km: number;
  last_service_km: number;
  service_interval_km: number;
  breakdowns: number;
  repairs: number;
  last_severity: "low" | "medium" | "high" | "critical" | null;
  last_event_date: string | null;
};

const RISK_SQL = `
SELECT v.id, v.registration, v.model, v.depot_id, d.name AS depot_name, v.status,
       v.capacity, v.age_years, v.odometer_km, v.last_service_km, v.service_interval_km,
       COALESCE(m.breakdowns, 0) AS breakdowns,
       COALESCE(m.repairs, 0)    AS repairs,
       ls.severity               AS last_severity,
       ls.event_date             AS last_event_date
FROM vehicles v
JOIN depots d ON d.id = v.depot_id
LEFT JOIN (
  SELECT vehicle_id,
         SUM(CASE WHEN event_type = 'breakdown' THEN 1 ELSE 0 END) AS breakdowns,
         SUM(CASE WHEN event_type = 'repair'    THEN 1 ELSE 0 END) AS repairs
  FROM maintenance
  WHERE event_date >= ?
  GROUP BY vehicle_id
) m ON m.vehicle_id = v.id
LEFT JOIN (
  SELECT vehicle_id, severity, event_date FROM (
    SELECT vehicle_id, severity, event_date,
           ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY event_date DESC, id DESC) AS rn
    FROM maintenance
  ) WHERE rn = 1
) ls ON ls.vehicle_id = v.id
WHERE v.status = 'active'
ORDER BY v.id
`;

export type VehicleRiskBoard = {
  rows: VehicleRiskRow[];
  summary: {
    active: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    fleetAvgScore: number;
    serviceOverdue: number;
  };
};

export const getVehicleRiskBoard = cache((limit = 200): VehicleRiskBoard => {
  const db = getSqlite();
  const { start } = dbDateRange(90);
  const raw = db.prepare(RISK_SQL).all(start) as RiskQueryRow[];

  const rows: VehicleRiskRow[] = raw.map((r) => {
    const risk = riskScore({
      vehicleId: r.id,
      ageYears: r.age_years,
      odometerKm: r.odometer_km,
      lastServiceKm: r.last_service_km,
      serviceIntervalKm: r.service_interval_km,
      breakdowns90d: r.breakdowns,
      repairs90d: r.repairs,
      lastFaultSeverity: r.last_severity,
    });
    return {
      ...risk,
      registration: r.registration,
      model: r.model,
      depotId: r.depot_id,
      depotName: r.depot_name,
      status: r.status,
      capacity: r.capacity,
      odometerKm: r.odometer_km,
      lastServiceKm: r.last_service_km,
      serviceIntervalKm: r.service_interval_km,
      ageYears: r.age_years,
      lastEventDate: r.last_event_date,
    };
  });

  rows.sort((a, b) => b.score - a.score);

  const summary = {
    active: rows.length,
    critical: rows.filter((r) => r.band === "critical").length,
    high: rows.filter((r) => r.band === "high").length,
    moderate: rows.filter((r) => r.band === "moderate").length,
    low: rows.filter((r) => r.band === "low").length,
    fleetAvgScore:
      rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0,
    serviceOverdue: rows.filter((r) => r.kmSinceService > r.serviceIntervalKm).length,
  };

  return { rows: rows.slice(0, limit), summary };
});

export type RouteUtilizationRow = {
  routeId: string;
  code: string;
  name: string;
  depotName: string;
  routeType: string;
  trips: number;
  boardings: number;
  seats: number;
  revenue: number;
  scheduledKm: number;
  actualKm: number;
  loadFactor: number;
  deadKmRatio: number;
};

export const getRouteUtilization = cache((days = 30): RouteUtilizationRow[] => {
  const db = getSqlite();
  const { start, end } = dbDateRange(days);

  const rows = db
    .prepare(
      `SELECT r.id AS routeId, r.code, r.name, d.name AS depotName, r.route_type AS routeType,
              t.trips, t.seats, t.scheduledKm, t.actualKm,
              COALESCE(k.boardings, 0) AS boardings,
              COALESCE(k.revenue, 0) AS revenue
       FROM routes r
       JOIN depots d ON d.id = r.depot_id
       JOIN (
         SELECT tr.route_id AS routeId, COUNT(*) AS trips,
                SUM(v.capacity) AS seats,
                SUM(tr.scheduled_km) AS scheduledKm,
                SUM(tr.actual_km) AS actualKm
         FROM trips tr
         JOIN vehicles v ON v.id = tr.vehicle_id
         WHERE tr.service_date BETWEEN ? AND ? AND tr.status <> 'cancelled'
         GROUP BY tr.route_id
       ) t ON t.routeId = r.id
       LEFT JOIN (
         SELECT tr.route_id AS routeId,
                SUM(tk.tickets_sold) AS boardings,
                SUM(tk.net_amount) AS revenue
         FROM tickets tk
         JOIN trips tr ON tr.id = tk.trip_id
         WHERE tr.service_date BETWEEN ? AND ? AND tr.status <> 'cancelled'
         GROUP BY tr.route_id
       ) k ON k.routeId = r.id
       ORDER BY boardings DESC`,
    )
    .all(start, end, start, end) as Omit<RouteUtilizationRow, "loadFactor" | "deadKmRatio">[];

  return rows.map((r) => {
    const u = utilization({
      scheduledKm: r.scheduledKm,
      actualKm: r.actualKm,
      boardings: r.boardings,
      seats: r.seats,
    });
    return { ...r, loadFactor: u.loadFactor, deadKmRatio: u.deadKmRatio };
  });
});

export type VehicleDetail = {
  vehicle: {
    id: string;
    registration: string;
    model: string;
    depotName: string;
    capacity: number;
    ageYears: number;
    odometerKm: number;
    lastServiceKm: number;
    serviceIntervalKm: number;
    commissionedOn: string;
    status: string;
  };
  risk: RiskResult;
  events: {
    id: number;
    eventDate: string;
    eventType: string;
    odometerKm: number;
    downtimeDays: number;
    costInr: number;
    faultCode: string | null;
    severity: string;
    notes: string | null;
  }[];
  last30: { trips: number; boardings: number; revenue: number; km: number; loadFactor: number };
};

export const getVehicleDetail = cache((vehicleId: string): VehicleDetail | null => {
  const db = getSqlite();
  const v = db
    .prepare(
      `SELECT v.*, d.name AS depot_name FROM vehicles v JOIN depots d ON d.id = v.depot_id WHERE v.id = ?`,
    )
    .get(vehicleId) as
    | {
        id: string;
        registration: string;
        model: string;
        depot_name: string;
        capacity: number;
        age_years: number;
        odometer_km: number;
        last_service_km: number;
        service_interval_km: number;
        commissioned_on: string;
        status: string;
      }
    | undefined;
  if (!v) return null;

  const { start, end } = dbDateRange(90);
  const events = db
    .prepare(
      `SELECT id, event_date, event_type, odometer_km, downtime_days, cost_inr,
              fault_code, severity, notes
       FROM maintenance WHERE vehicle_id = ? ORDER BY event_date DESC LIMIT 40`,
    )
    .all(vehicleId) as {
    id: number;
    event_date: string;
    event_type: string;
    odometer_km: number;
    downtime_days: number;
    cost_inr: number;
    fault_code: string | null;
    severity: string;
    notes: string | null;
  }[];

  const breakdowns = events.filter(
    (e) => e.event_type === "breakdown" && e.event_date >= start,
  ).length;
  const repairs = events.filter((e) => e.event_type === "repair" && e.event_date >= start).length;
  const lastFault = events.find((e) => e.fault_code);

  const risk = riskScore({
    vehicleId: v.id,
    ageYears: v.age_years,
    odometerKm: v.odometer_km,
    lastServiceKm: v.last_service_km,
    serviceIntervalKm: v.service_interval_km,
    breakdowns90d: breakdowns,
    repairs90d: repairs,
    lastFaultSeverity: (lastFault?.severity ?? null) as
      | "low"
      | "medium"
      | "high"
      | "critical"
      | null,
  });

  // Trips and sales are aggregated separately: a trip has one or two ticket
  // rows, so joining them in one GROUP BY would double-count distance and seats.
  const last30Trips = db
    .prepare(
      `SELECT COUNT(*) AS trips, COALESCE(SUM(actual_km), 0) AS km
       FROM trips
       WHERE vehicle_id = ? AND service_date BETWEEN ? AND ? AND status <> 'cancelled'`,
    )
    .get(vehicleId, start, end) as { trips: number; km: number };

  const last30Sales = db
    .prepare(
      `SELECT COALESCE(SUM(tk.tickets_sold), 0) AS boardings,
              COALESCE(SUM(tk.net_amount), 0) AS revenue
       FROM tickets tk
       JOIN trips tr ON tr.id = tk.trip_id
       WHERE tr.vehicle_id = ? AND tr.service_date BETWEEN ? AND ? AND tr.status <> 'cancelled'`,
    )
    .get(vehicleId, start, end) as { boardings: number; revenue: number };

  const seats = last30Trips.trips * v.capacity;

  return {
    vehicle: {
      id: v.id,
      registration: v.registration,
      model: v.model,
      depotName: v.depot_name,
      capacity: v.capacity,
      ageYears: v.age_years,
      odometerKm: v.odometer_km,
      lastServiceKm: v.last_service_km,
      serviceIntervalKm: v.service_interval_km,
      commissionedOn: v.commissioned_on,
      status: v.status,
    },
    risk,
    events: events.map((e) => ({
      id: e.id,
      eventDate: e.event_date,
      eventType: e.event_type,
      odometerKm: e.odometer_km,
      downtimeDays: e.downtime_days,
      costInr: e.cost_inr,
      faultCode: e.fault_code,
      severity: e.severity,
      notes: e.notes,
    })),
    last30: {
      trips: last30Trips.trips,
      boardings: last30Sales.boardings,
      revenue: last30Sales.revenue,
      km: last30Trips.km,
      loadFactor: seats > 0 ? last30Sales.boardings / seats : 0,
    },
  };
});
