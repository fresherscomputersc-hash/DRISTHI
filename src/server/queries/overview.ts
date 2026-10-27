import { cache } from "react";
import { getSqlite } from "@/db/client";
import { dbDateRange } from "./shared";
import { getDetections } from "./revenue";

export type FleetSnapshot = {
  total: number;
  active: number;
  outOfService: number;
  maintenance: number;
  idle: number;
};

export type Overview = {
  windowDays: number;
  fleet: FleetSnapshot;
  trips: number;
  boardings: number;
  revenue: number;
  seats: number;
  loadFactor: number;
  alerts: number;
  revenueAtRisk: number;
  openCases: number;
  boardings7d: number;
  boardingsPrev7d: number;
  demandDeltaPct: number;
  topAlerts: ReturnType<typeof getDetections>;
  avgDailyRevenue: number;
};

export const getOverview = cache((windowDays = 30): Overview => {
  const db = getSqlite();
  const { start, end } = dbDateRange(windowDays);
  const prevEnd = `${start}`;
  const prevStart = dbDateRange(windowDays * 2).start;

  const kpi = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM vehicles) AS total,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'active') AS active,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance') AS maintenance,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'idle') AS idle,
        (SELECT COUNT(*) FROM trips WHERE service_date BETWEEN ? AND ? AND status <> 'cancelled') AS trips,
        (SELECT COALESCE(SUM(tk.tickets_sold),0) FROM tickets tk JOIN trips tr ON tr.id = tk.trip_id
           WHERE tr.service_date BETWEEN ? AND ?) AS boardings,
        (SELECT COALESCE(SUM(tk.net_amount),0) FROM tickets tk JOIN trips tr ON tr.id = tk.trip_id
           WHERE tr.service_date BETWEEN ? AND ?) AS revenue,
        (SELECT COALESCE(SUM(v.capacity),0) FROM trips tr JOIN vehicles v ON v.id = tr.vehicle_id
           WHERE tr.service_date BETWEEN ? AND ? AND tr.status <> 'cancelled') AS seats,
        (SELECT COUNT(*) FROM cases WHERE status <> 'resolved') AS open_cases`,
    )
    .get(start, end, start, end, start, end, start, end) as {
    total: number;
    active: number;
    maintenance: number;
    idle: number;
    trips: number;
    boardings: number;
    revenue: number;
    seats: number;
    open_cases: number;
  };

  const recent7 = dbDateRange(7);
  const prior7 = dbDateRange(14);
  const boardings7d = (
    db
      .prepare(
        `SELECT COALESCE(SUM(tk.tickets_sold),0) v FROM tickets tk
         JOIN trips tr ON tr.id = tk.trip_id WHERE tr.service_date BETWEEN ? AND ?`,
      )
      .get(recent7.start, recent7.end) as { v: number }
  ).v;
  const boardingsPrev7d = (
    db
      .prepare(
        `SELECT COALESCE(SUM(tk.tickets_sold),0) v FROM tickets tk
         JOIN trips tr ON tr.id = tk.trip_id
         WHERE tr.service_date BETWEEN ? AND ? AND tr.service_date < ?`,
      )
      .get(prior7.start, prevEnd, recent7.start) as { v: number }
  ).v;

  const detections = getDetections({ days: windowDays });
  const revenueAtRisk = detections.reduce((s, d) => s + d.rupeesImpact, 0);
  void prevStart;

  return {
    windowDays,
    fleet: {
      total: kpi.total,
      active: kpi.active,
      outOfService: kpi.total - kpi.active,
      maintenance: kpi.maintenance,
      idle: kpi.idle,
    },
    trips: kpi.trips,
    boardings: kpi.boardings,
    revenue: kpi.revenue,
    seats: kpi.seats,
    loadFactor: kpi.seats > 0 ? kpi.boardings / kpi.seats : 0,
    alerts: detections.length,
    revenueAtRisk,
    openCases: kpi.open_cases,
    boardings7d,
    boardingsPrev7d,
    demandDeltaPct:
      boardingsPrev7d > 0 ? ((boardings7d - boardingsPrev7d) / boardingsPrev7d) * 100 : 0,
    topAlerts: detections.slice(0, 6),
    avgDailyRevenue: kpi.revenue / windowDays,
  };
});

export type DepotPerformance = {
  depotId: string;
  depotName: string;
  trips: number;
  boardings: number;
  revenue: number;
  loadFactor: number;
  atRisk: number;
};

export const getDepotPerformance = cache((days = 30): DepotPerformance[] => {
  const db = getSqlite();
  const { start, end } = dbDateRange(days);

  const rows = db
    .prepare(
      `SELECT d.id AS depotId, d.name AS depotName,
              COUNT(DISTINCT tr.id) AS trips,
              COALESCE(SUM(tk.tickets_sold),0) AS boardings,
              COALESCE(SUM(tk.net_amount),0) AS revenue,
              (SELECT COALESCE(SUM(v.capacity),0)
                 FROM trips tr2 JOIN vehicles v ON v.id = tr2.vehicle_id
                WHERE tr2.depot_id = d.id
                  AND tr2.service_date BETWEEN ? AND ?
                  AND tr2.status <> 'cancelled') AS seats
       FROM depots d
       JOIN trips tr ON tr.depot_id = d.id AND tr.service_date BETWEEN ? AND ? AND tr.status <> 'cancelled'
       LEFT JOIN tickets tk ON tk.trip_id = tr.id
       GROUP BY d.id, d.name
       ORDER BY revenue DESC`,
    )
    .all(start, end, start, end) as {
    depotId: string;
    depotName: string;
    trips: number;
    boardings: number;
    revenue: number;
    seats: number;
  }[];

  const riskByDepot = new Map<string, number>();
  for (const d of getDetections({ days })) {
    riskByDepot.set(d.depotId, (riskByDepot.get(d.depotId) ?? 0) + d.rupeesImpact);
  }

  return rows.map((r) => ({
    depotId: r.depotId,
    depotName: r.depotName,
    trips: r.trips,
    boardings: r.boardings,
    revenue: r.revenue,
    loadFactor: r.seats > 0 ? r.boardings / r.seats : 0,
    atRisk: riskByDepot.get(r.depotId) ?? 0,
  }));
});
