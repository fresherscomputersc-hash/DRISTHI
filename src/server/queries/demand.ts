import { cache } from "react";
import { capacityGap, forecastDemand, type CapacityGap, type ForecastResult, type SeriesPoint } from "@/core/forecast";
import { getSqlite } from "@/db/client";
import { addDays } from "@/lib/utils";
import { dataWindowEnd } from "./shared";

export type RouteOption = {
  id: string;
  code: string;
  name: string;
  depotName: string;
  distanceKm: number;
  routeType: string;
  departuresPerDay: number;
};

export const getRouteOptions = cache((): RouteOption[] => {
  const db = getSqlite();
  return db
    .prepare(
      `SELECT r.id, r.code, r.name, d.name AS depotName, r.distance_km AS distanceKm,
              r.route_type AS routeType, r.departures_per_day AS departuresPerDay
       FROM routes r JOIN depots d ON d.id = r.depot_id
       ORDER BY d.name, r.name`,
    )
    .all() as RouteOption[];
});

type DailyRow = {
  routeId: string;
  date: string;
  boardings: number;
  trips: number;
  seats: number;
  revenue: number;
};

export type DemandDetail = {
  route: RouteOption & { baseFarePerKm: number };
  history: SeriesPoint[];
  forecast: ForecastResult;
  gap: CapacityGap | null;
  capacityPerTrip: number;
  tripsPerDay: number;
  avgFare: number;
  last30: { boardings: number; revenue: number; trips: number };
};

export const getDemandDetail = cache((routeId: string): DemandDetail | null => {
  const db = getSqlite();
  const route = db
    .prepare(
      `SELECT r.id, r.code, r.name, d.name AS depotName, r.distance_km AS distanceKm,
              r.route_type AS routeType, r.departures_per_day AS departuresPerDay,
              r.base_fare_per_km AS baseFarePerKm
       FROM routes r JOIN depots d ON d.id = r.depot_id WHERE r.id = ?`,
    )
    .get(routeId) as
    | (RouteOption & { baseFarePerKm: number })
    | undefined;
  if (!route) return null;

  const rows = db
    .prepare(
      `SELECT tr.service_date AS date,
              COALESCE(SUM(tk.tickets_sold),0) AS boardings,
              COUNT(DISTINCT tr.id) AS trips,
              COALESCE(SUM(tk.net_amount),0) AS revenue,
              COALESCE((SELECT SUM(vv.capacity) FROM trips tr2 JOIN vehicles vv ON vv.id = tr2.vehicle_id
                        WHERE tr2.route_id = tr.route_id AND tr2.service_date = tr.service_date
                          AND tr2.status <> 'cancelled'),0) AS seats
       FROM trips tr
       LEFT JOIN tickets tk ON tk.trip_id = tr.id
       WHERE tr.route_id = ? AND tr.status <> 'cancelled'
       GROUP BY tr.service_date
       ORDER BY tr.service_date`,
    )
    .all(routeId) as { date: string; boardings: number; trips: number; revenue: number; seats: number }[];

  const history: SeriesPoint[] = rows.map((r) => ({ date: r.date, value: r.boardings }));
  const totalSeats = rows.reduce((s, r) => s + r.seats, 0);
  const totalTrips = rows.reduce((s, r) => s + r.trips, 0);
  const totalBoardings = rows.reduce((s, r) => s + r.boardings, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const capacityPerTrip = totalTrips > 0 ? Math.round(totalSeats / totalTrips) : 44;
  const tripsPerDay = rows.length > 0 ? totalTrips / rows.length : route.departuresPerDay;
  const avgFare = totalBoardings > 0 ? totalRevenue / totalBoardings : 60;

  const forecast = forecastDemand(history, 7);
  const tomorrow = forecast.points[0];
  const gap = tomorrow ? capacityGap(tomorrow.value, capacityPerTrip, tripsPerDay) : null;

  const last30Rows = rows.slice(-30);

  return {
    route,
    history,
    forecast,
    gap,
    capacityPerTrip,
    tripsPerDay: Math.round(tripsPerDay * 10) / 10,
    avgFare,
    last30: {
      boardings: last30Rows.reduce((s, r) => s + r.boardings, 0),
      revenue: last30Rows.reduce((s, r) => s + r.revenue, 0),
      trips: last30Rows.reduce((s, r) => s + r.trips, 0),
    },
  };
});

export type DemandRow = {
  routeId: string;
  code: string;
  name: string;
  depotName: string;
  routeType: string;
  loadFactor: number;
  forecast: number;
  seats: number;
  gap: CapacityGap | null;
  avgFare: number;
  expectedDailyInr: number;
};

export type DemandBoard = {
  rows: DemandRow[];
  totals: {
    routes: number;
    overCapacity: number;
    underUtilised: number;
    refused: number;
    opportunityInr: number;
    /** First forecast day, shared by every route. */
    tomorrow: string | null;
    tomorrowBoardings: number;
  };
};

/**
 * One grouped query feeds every route's forecast. 192 routes × 90 days is
 * ~17k rows — small enough to forecast the whole network on each request.
 *
 * The dataset is immutable between seeds, and the forecast is deterministic, so
 * the board is memoised for the life of the process. The first request pays the
 * ~0.7 s fit; every later page (including the Command Center strip) is free.
 */
let boardMemo: DemandBoard | null = null;

export const getDemandBoard = cache((): DemandBoard => {
  if (boardMemo) return boardMemo;
  const db = getSqlite();
  // Sales and seats are aggregated separately: joining tickets multiplies trip
  // rows, which would double-count vehicle capacity and understate load factor.
  const rows = db
    .prepare(
      `SELECT tr.route_id AS routeId,
              r.code, r.name, r.route_type AS routeType,
              d.name AS depotName,
              tr.service_date AS date,
              COALESCE(SUM(tk.tickets_sold),0) AS boardings,
              COALESCE(SUM(tk.net_amount),0) AS revenue,
              COUNT(DISTINCT tr.id) AS trips
       FROM trips tr
       JOIN routes r ON r.id = tr.route_id
       JOIN depots d ON d.id = tr.depot_id
       LEFT JOIN tickets tk ON tk.trip_id = tr.id
       WHERE tr.status <> 'cancelled'
       GROUP BY tr.route_id, tr.service_date
       ORDER BY tr.route_id, tr.service_date`,
    )
    .all() as (Omit<DailyRow, "seats"> & { code: string; name: string; routeType: string; depotName: string })[];

  const seatRows = db
    .prepare(
      `SELECT tr.route_id AS routeId, tr.service_date AS date, SUM(v.capacity) AS seats
       FROM trips tr JOIN vehicles v ON v.id = tr.vehicle_id
       WHERE tr.status <> 'cancelled'
       GROUP BY tr.route_id, tr.service_date`,
    )
    .all() as { routeId: string; date: string; seats: number }[];

  const seatsByKey = new Map<string, number>();
  for (const row of seatRows) seatsByKey.set(`${row.routeId}|${row.date}`, row.seats);

  const byRoute = new Map<string, (DailyRow & { code: string; name: string; routeType: string; depotName: string })[]>();
  for (const row of rows) {
    const arr = byRoute.get(row.routeId) ?? [];
    arr.push({ ...row, seats: seatsByKey.get(`${row.routeId}|${row.date}`) ?? 0 });
    byRoute.set(row.routeId, arr);
  }

  const out: DemandRow[] = [];
  let overCapacity = 0;
  let underUtilised = 0;
  let refused = 0;
  let opportunityInr = 0;
  let forecastDate: string | null = null;
  let forecastBoardings = 0;

  for (const [routeId, series] of byRoute) {
    const boardings = series.map((s) => s.boardings);
    const totalSeats = series.reduce((s, r) => s + r.seats, 0);
    const totalTrips = series.reduce((s, r) => s + r.trips, 0);
    const totalBoardings = series.reduce((s, r) => s + r.boardings, 0);
    const totalRevenue = series.reduce((s, r) => s + r.revenue, 0);

    const capacityPerTrip = totalTrips > 0 ? Math.round(totalSeats / totalTrips) : 44;
    const tripsPerDay = series.length > 0 ? totalTrips / series.length : 6;
    const avgFare = totalBoardings > 0 ? totalRevenue / totalBoardings : 60;

    const history: SeriesPoint[] = series.map((s) => ({ date: s.date, value: s.boardings }));
    const forecast = forecastDemand(history, 7);

    if (!forecast.meetsThreshold || forecast.points.length === 0) {
      refused += 1;
      continue;
    }

    const tomorrow = forecast.points[0].value;
    if (forecastDate === null) forecastDate = forecast.points[0].date;
    forecastBoardings += tomorrow;
    const gap = capacityGap(tomorrow, capacityPerTrip, tripsPerDay);
    if (gap?.kind === "over_capacity") overCapacity += 1;
    if (gap?.kind === "under_utilised") underUtilised += 1;

    const expectedDailyInr = gap
      ? gap.kind === "over_capacity"
        ? Math.round((tomorrow - capacityPerTrip * tripsPerDay) * avgFare)
        : Math.round((capacityPerTrip * tripsPerDay - tomorrow) * avgFare * 0.25)
      : 0;
    opportunityInr += Math.max(0, expectedDailyInr);

    out.push({
      routeId,
      code: series[0].code,
      name: series[0].name,
      depotName: series[0].depotName,
      routeType: series[0].routeType,
      loadFactor: totalBoardings / Math.max(1, totalSeats),
      forecast: tomorrow,
      seats: Math.round(capacityPerTrip * tripsPerDay),
      gap,
      avgFare,
      expectedDailyInr,
    });
    void boardings;
  }

  out.sort((a, b) => {
    const rank = (g: CapacityGap | null) =>
      g?.kind === "over_capacity" ? 2 : g?.kind === "under_utilised" ? 1 : 0;
    const byRank = rank(b.gap) - rank(a.gap);
    if (byRank !== 0) return byRank;
    return (b.gap?.loadFactor ?? 0) - (a.gap?.loadFactor ?? 0);
  });

  const board: DemandBoard = {
    rows: out,
    totals: {
      routes: byRoute.size,
      overCapacity,
      underUtilised,
      refused,
      opportunityInr,
      tomorrow: forecastDate,
      tomorrowBoardings: forecastBoardings,
    },
  };
  boardMemo = board;
  return board;
});

export function nextWeek(): string[] {
  const end = dataWindowEnd();
  return Array.from({ length: 7 }, (_, i) => addDays(end, i + 1));
}
