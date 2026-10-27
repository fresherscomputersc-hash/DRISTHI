import { addDays } from "../../lib/utils";
import { DEPOTS, FAULT_CODES, VEHICLE_MODELS } from "./reference";
import { Rng } from "./rng";
import {
  anomalies as anomaliesTable,
  collections as collectionsTable,
  depots as depotTable,
  maintenance as maintenanceTable,
  routes as routesTable,
  telemetry as telemetryTable,
  tickets as ticketsTable,
  tripFinance as tripFinanceTable,
  trips as tripsTable,
  vehicles as vehiclesTable,
} from "../schema";

type DepotRow = typeof depotTable.$inferInsert;
type RouteRow = typeof routesTable.$inferInsert;
type VehicleRow = typeof vehiclesTable.$inferInsert;
type TripRow = typeof tripsTable.$inferInsert;
type TicketRow = typeof ticketsTable.$inferInsert;
type CollectionRow = typeof collectionsTable.$inferInsert;
type TelemetryRow = typeof telemetryTable.$inferInsert;
type MaintenanceRow = typeof maintenanceTable.$inferInsert;
type AnomalyRow = typeof anomaliesTable.$inferInsert;
type TripFinanceRow = typeof tripFinanceTable.$inferInsert;

export const SEED = 20261026;
export const SEED_VERSION = "drishti-2";
export const DAYS = 90;
export const END_DATE = "2026-10-25";
export const START_DATE = addDays(END_DATE, -(DAYS - 1));

export const REVENUE_KINDS = [
  "ETM_SYNC_FAILURE",
  "UNDER_COLLECTION",
  "DUPLICATE_SALE",
  "FARE_MISMATCH",
  "UNRECORDED_TRIP",
] as const;

export type RevenueKind = (typeof REVENUE_KINDS)[number];

export type Dataset = {
  depots: DepotRow[];
  routes: RouteRow[];
  vehicles: VehicleRow[];
  trips: TripRow[];
  tickets: TicketRow[];
  collections: CollectionRow[];
  telemetry: TelemetryRow[];
  maintenance: MaintenanceRow[];
  anomalies: AnomalyRow[];
  tripFinance: TripFinanceRow[];
  meta: Record<string, string>;
};

const DOW_FACTOR = [0.88, 1.06, 0.94, 0.95, 1.0, 1.12, 1.09]; // Sun..Sat
const FESTIVALS = new Set(["2026-08-15", "2026-09-04", "2026-09-25", "2026-10-02", "2026-10-20"]);

/**
 * Stable per-route demand pull, derived from the route id so it never drifts
 * between seeds. Real networks are not uniform: trunk corridors run hot while
 * remote rural routes run light. Without this spread the capacity-gap rule has
 * nothing to find, and the demand module is decorative.
 */
function routePull(routeId: string): number {
  let h = 2166136261;
  for (let i = 0; i < routeId.length; i += 1) {
    h ^= routeId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = ((h >>> 0) % 1000) / 999;
  return 0.5 + 1.25 * r * r;
}

function hourFactor(hour: number): number {
  if (hour <= 5) return 0.55;
  if (hour <= 8) return 1.18;
  if (hour <= 11) return 0.98;
  if (hour <= 15) return 0.84;
  if (hour <= 19) return 1.1;
  return 0.72;
}

function hhmm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function round5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

function slug(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

export function buildDataset(seed = SEED): Dataset {
  const rng = new Rng(seed);

  const depots: DepotRow[] = DEPOTS.map((d) => ({
    id: d.id,
    name: d.name,
    region: d.region,
    district: d.district,
  }));

  /* ---------------------------------------------------------------- */
  /* Routes                                                            */
  /* ---------------------------------------------------------------- */
  const routes: RouteRow[] = [];
  const routeMeta: { depotId: string; type: "mainline" | "rural" }[] = [];

  for (const depot of DEPOTS) {
    depot.hubs.forEach(([hub, km], i) => {
      routes.push({
        id: `R${String(routes.length + 1).padStart(3, "0")}`,
        code: `${depot.id}-${slug(hub)}-M${i + 1}`,
        name: `${depot.name} → ${hub}`,
        origin: depot.name,
        destination: hub,
        depotId: depot.id,
        distanceKm: km,
        routeType: "mainline",
        departuresPerDay: km > 300 ? 3 : km > 150 ? 5 : 7,
        baseFarePerKm: 1.05,
      });
      routeMeta.push({ depotId: depot.id, type: "mainline" });
    });

    depot.places.forEach((place, i) => {
      const km = Math.round(rng.int(18, 78) + (i % 3) * 6);
      routes.push({
        id: `R${String(routes.length + 1).padStart(3, "0")}`,
        code: `${depot.id}-${slug(place)}-R${i + 1}`,
        name: `${depot.name} → ${place}`,
        origin: depot.name,
        destination: place,
        depotId: depot.id,
        distanceKm: km,
        routeType: "rural",
        departuresPerDay: km > 60 ? 6 : 9,
        baseFarePerKm: 0.72,
      });
      routeMeta.push({ depotId: depot.id, type: "rural" });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Vehicles — exactly 1,999, with 109 out of service                 */
  /* ---------------------------------------------------------------- */
  const routeCountByDepot = new Map<string, number>();
  routeMeta.forEach((r) => routeCountByDepot.set(r.depotId, (routeCountByDepot.get(r.depotId) ?? 0) + 1));

  const totalRoutes = routes.length;
  const vehicles: VehicleRow[] = [];
  let vehicleSeq = 0;
  const OUT_OF_SERVICE = 109;

  DEPOTS.forEach((depot, depotIdx) => {
    const share = (routeCountByDepot.get(depot.id) ?? 0) / totalRoutes;
    const isLast = depotIdx === DEPOTS.length - 1;
    const count = isLast
      ? 1999 - vehicleSeq
      : Math.round(1999 * share);

    for (let i = 0; i < count; i += 1) {
      vehicleSeq += 1;
      const premium = rng.bool(0.06);
      const mainlineShare = rng.bool(0.29);
      const pool = premium
        ? [VEHICLE_MODELS[3]]
        : VEHICLE_MODELS.filter((m) =>
            mainlineShare ? m.routeType === "mainline" : m.routeType === "rural",
          );
      const model = rng.pick(pool);
      const ageYears = Number(rng.float(0.3, 13.5).toFixed(1));
      const odometerKm = Math.round(ageYears * rng.float(55_000, 95_000));
      const serviceIntervalKm = rng.pick([15_000, 20_000, 25_000]);
      const lastServiceKm = Math.max(
        0,
        odometerKm - rng.int(500, Math.round(serviceIntervalKm * 1.35)),
      );
      const commissionedOn = addDays(END_DATE, -Math.round(ageYears * 365));

      vehicles.push({
        id: `V${String(vehicleSeq).padStart(4, "0")}`,
        registration: `OD-${depot.regCode}-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(
          65 + ((i * 7) % 26),
        )}-${String(1000 + ((vehicleSeq * 37) % 9000))}`,
        model: model.model,
        depotId: depot.id,
        capacity: model.capacity,
        ageYears,
        odometerKm,
        lastServiceKm,
        serviceIntervalKm,
        commissionedOn,
        status: "active",
      });
    }
  });

  // 109 buses out of service — mirrors the published OSRTC figure.
  const oosRng = new Rng(seed + 991);
  const oosIndexes = oosRng.shuffle(vehicles.map((_, i) => i)).slice(0, OUT_OF_SERVICE);
  const oosSet = new Set(oosIndexes);
  oosIndexes.forEach((idx, i) => {
    vehicles[idx].status = i % 3 === 2 ? "idle" : "maintenance";
  });

  const activeByDepot = new Map<string, VehicleRow[]>();
  for (const v of vehicles) {
    if (v.status !== "active") continue;
    const arr = activeByDepot.get(v.depotId) ?? [];
    arr.push(v);
    activeByDepot.set(v.depotId, arr);
  }

  /* ---------------------------------------------------------------- */
  /* Trips, tickets, collections, telemetry                            */
  /* ---------------------------------------------------------------- */
  const trips: TripRow[] = [];
  const tickets: TicketRow[] = [];
  const collections: CollectionRow[] = [];
  const telemetry: TelemetryRow[] = [];
  const tripIndex = new Map<
    string,
    { trip: TripRow; tickets: TicketRow[]; collections: CollectionRow[] }
  >();

  let tripSeq = 0;

  for (let day = 0; day < DAYS; day += 1) {
    const date = addDays(START_DATE, day);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const dowFactor = DOW_FACTOR[dow];
    const festival = FESTIVALS.has(date) ? 1.28 : 1;
    const trend = 1 + day * 0.0016;

    routes.forEach((route, routeIdx) => {
      const depotVehicles = activeByDepot.get(route.depotId) ?? [];
      if (depotVehicles.length === 0) return;

      const departures = route.departuresPerDay;
      const spacing = Math.floor((15 * 60) / departures);

      for (let dep = 0; dep < departures; dep += 1) {
        tripSeq += 1;
        const vehicle = depotVehicles[(routeIdx * 7 + dep * 13 + day) % depotVehicles.length];
        const departureMin = 5 * 60 + 30 + dep * spacing;
        const travelMin = Math.round((route.distanceKm / 38) * 60);
        const cancelled = rng.bool(0.014);
        const partial = !cancelled && rng.bool(0.025);

        const tripId = `T${String(tripSeq).padStart(6, "0")}`;
        const scheduledKm = route.distanceKm;
        const actualKm = cancelled
          ? 0
          : partial
            ? Number((scheduledKm * rng.float(0.35, 0.8)).toFixed(1))
            : Number((scheduledKm * rng.float(0.98, 1.09)).toFixed(1));

        const trip: TripRow = {
          id: tripId,
          routeId: route.id,
          vehicleId: vehicle.id,
          depotId: route.depotId,
          serviceDate: date,
          departureTime: hhmm(departureMin),
          arrivalTime: hhmm(departureMin + travelMin),
          scheduledKm,
          actualKm,
          status: cancelled ? "cancelled" : partial ? "partial" : "completed",
          tripType: "scheduled",
        };
        trips.push(trip);

        if (cancelled) continue;

        const baseLoad = route.routeType === "mainline" ? 0.72 : 0.62;
        const load = Math.min(
          1.12,
          Math.max(
            0.16,
            baseLoad *
              routePull(route.id) *
              dowFactor *
              festival *
              trend *
              hourFactor(Math.floor(departureMin / 60)) *
              (1 + rng.normal(0, 0.11)),
          ),
        );

        const capacity = vehicle.capacity ?? 40;
        const boardings = Math.max(1, Math.round(capacity * load * (partial ? 0.6 : 1)));
        const fare = round5(Math.max(15, route.distanceKm * (route.baseFarePerKm ?? 0.8)));
        const discountRate = rng.bool(0.28) ? rng.float(0.03, 0.12) : 0;
        const gross = boardings * fare;
        const discount = gross * discountRate;
        const net = gross - discount;

        // Channel split by route length — long routes book ahead on OPRS.
        let weights: { channel: TicketRow["channel"]; w: number }[];
        if (route.distanceKm > 120) {
          weights = [
            { channel: "oprs", w: 0.55 },
            { channel: "etm", w: 0.45 },
          ];
        } else if (route.distanceKm > 60) {
          weights = [
            { channel: "oprs", w: 0.25 },
            { channel: "etm", w: 0.7 },
            { channel: "counter", w: 0.05 },
          ];
        } else {
          weights = [
            { channel: "etm", w: 0.76 },
            { channel: "counter", w: 0.24 },
          ];
        }

        let remaining = boardings;
        let remainingNet = net;
        const tripTickets: TicketRow[] = [];
        weights.forEach((entry, wIdx) => {
          const isLast = wIdx === weights.length - 1;
          const count = isLast
            ? remaining
            : Math.max(0, Math.round(boardings * entry.w + rng.normal(0, 0.6)));
          if (count <= 0 && !isLast) return;
          const amount = isLast ? remainingNet : (net * count) / Math.max(1, boardings);
          remaining -= count;
          remainingNet -= amount;
          if (count <= 0) return;

          const grossAmount = discountRate > 0 ? amount / (1 - discountRate) : amount;

          tripTickets.push({
            tripId,
            channel: entry.channel,
            ticketsSold: count,
            grossAmount: Number(grossAmount.toFixed(2)),
            discountAmount: Number((grossAmount - amount).toFixed(2)),
            netAmount: Number(amount.toFixed(2)),
          });
        });

        if (tripTickets.length === 0) {
          tripTickets.push({
            tripId,
            channel: "etm",
            ticketsSold: boardings,
            grossAmount: Number(net.toFixed(2)),
            discountAmount: 0,
            netAmount: Number(net.toFixed(2)),
          });
        }

        const tripCollections: CollectionRow[] = [];
        for (const t of tripTickets) {
          const split =
            t.channel === "oprs"
              ? { cash: 0, online: 1 }
              : t.channel === "counter"
                ? { cash: 0.92, online: 0.08 }
                : { cash: 0.85, online: 0.15 };
          // Sub-rupee rounding noise: real ledgers are never clean, but it is
          // well under the detection tolerance so it must not create alerts.
          const noise = Number(rng.float(0, 3.5).toFixed(2));
          const amount = t.netAmount - noise;
          tripCollections.push({
            tripId,
            channel: t.channel,
            cashAmount: Number((amount * split.cash).toFixed(2)),
            onlineAmount: Number((amount * split.online).toFixed(2)),
            remittedOn: addDays(date, t.channel === "oprs" ? 0 : rng.int(0, 2)),
            syncStatus: "synced",
          });
        }

        tickets.push(...tripTickets);
        collections.push(...tripCollections);
        telemetry.push({
          tripId,
          gpsPoints: Math.max(4, Math.round(actualKm / 0.4) + rng.int(-6, 6)),
          distanceKm: actualKm,
          avgSpeedKmph: Number(rng.float(31, 46).toFixed(1)),
          maxSpeedKmph: Number(rng.float(62, 92).toFixed(1)),
          idleMinutes: rng.int(2, 34),
          gpsGapMinutes:
            route.routeType === "rural" && rng.bool(0.14) ? rng.int(25, 70) : rng.int(0, 9),
          lastPing: `${date}T${hhmm(departureMin + travelMin)}:00+05:30`,
        });

        tripIndex.set(tripId, { trip, tickets: tripTickets, collections: tripCollections });
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Maintenance history                                               */
  /* ---------------------------------------------------------------- */
  const maintenance: MaintenanceRow[] = [];
  for (const vehicle of vehicles) {
    const events = rng.poisson(1.1 + vehicle.ageYears * 0.22);
    for (let i = 0; i < events; i += 1) {
      const eventDate = addDays(START_DATE, rng.int(0, DAYS - 1));
      const roll = rng.float();
      const eventType: MaintenanceRow["eventType"] =
        roll < 0.44 ? "service" : roll < 0.74 ? "repair" : roll < 0.87 ? "inspection" : "breakdown";
      const fault = FAULT_CODES[rng.int(0, FAULT_CODES.length - 1)];
      const isFault = eventType === "repair" || eventType === "breakdown";
      maintenance.push({
        vehicleId: vehicle.id,
        eventDate,
        eventType,
        odometerKm: Math.max(0, vehicle.odometerKm - rng.int(0, 22_000)),
        downtimeDays:
          eventType === "service" ? Number(rng.float(0.2, 1).toFixed(1))
            : eventType === "breakdown" ? Number(rng.float(1, 9).toFixed(1))
              : Number(rng.float(0.2, 4).toFixed(1)),
        costInr: Math.round(
          (eventType === "service" ? rng.float(4_000, 12_000)
            : eventType === "breakdown" ? rng.float(18_000, 95_000)
              : rng.float(2_500, 40_000)),
        ),
        faultCode: isFault ? fault.code : null,
        severity: isFault ? fault.severity : eventType === "inspection" ? "low" : "medium",
        notes: isFault ? fault.label : eventType === "service" ? "Scheduled service" : null,
      });
    }
  }

  // Out-of-service buses get a recent breakdown so maintenance views are coherent.
  oosIndexes.forEach((idx, i) => {
    const vehicle = vehicles[idx];
    maintenance.push({
      vehicleId: vehicle.id,
      eventDate: addDays(END_DATE, -rng.int(2, 20)),
      eventType: "breakdown",
      odometerKm: vehicle.odometerKm,
      downtimeDays: Number(rng.float(6, 42).toFixed(1)),
      costInr: Math.round(rng.float(35_000, 140_000)),
      faultCode: FAULT_CODES[i % FAULT_CODES.length].code,
      severity: "critical",
      notes: "Vehicle withdrawn from service pending repair",
    });
  });

  /* ---------------------------------------------------------------- */
  /* Anomaly injection (ground truth)                                  */
  /* ---------------------------------------------------------------- */
  const anomalies: AnomalyRow[] = [];
  const removedTickets = new Set<TicketRow>();
  const removedCollections = new Set<CollectionRow>();
  const injectRng = new Rng(seed + 4242);

  const eligible = trips.filter((t) => t.status !== "cancelled");
  const pool = injectRng.shuffle(eligible);
  let cursor = 0;
  const nextTrip = () => {
    const t = pool[cursor % pool.length];
    cursor += 1;
    return t;
  };

  const pushAnomaly = (
    kind: string,
    entityType: AnomalyRow["entityType"],
    entityId: string,
    rupees: number,
    date: string,
    note: string,
  ) => {
    anomalies.push({
      id: `A${String(anomalies.length + 1).padStart(4, "0")}`,
      entityType,
      entityId,
      kind,
      rupeesImpact: Number(rupees.toFixed(2)),
      injectedOn: date,
      note,
    });
  };

  // 1. ETM sync failures — the collection never arrives.
  for (let i = 0; i < 600; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    const row = entry?.tickets.find((t) => t.channel === "etm");
    if (!entry || !row) continue;
    const collection = entry.collections.find((c) => c.channel === "etm");
    if (collection) removedCollections.add(collection);
    pushAnomaly(
      "ETM_SYNC_FAILURE",
      "trip",
      trip.id,
      row.netAmount,
      trip.serviceDate,
      "ETM batch did not sync; remittance missing for the trip",
    );
  }

  // 2. Under-collection — cash falls short of tickets issued.
  for (let i = 0; i < 600; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    const collection = entry?.collections.find((c) => c.channel === "etm" || c.channel === "counter");
    if (!entry || !collection) continue;
    const shortfall = Math.max(30, collection.cashAmount * injectRng.float(0.09, 0.26));
    collection.cashAmount = Number(Math.max(0, collection.cashAmount - shortfall).toFixed(2));
    pushAnomaly(
      "UNDER_COLLECTION",
      "trip",
      trip.id,
      shortfall,
      trip.serviceDate,
      "Cash remitted is below the value of tickets issued",
    );
  }

  // 3. Duplicate remittance.
  for (let i = 0; i < 260; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    const collection = entry?.collections[0];
    if (!entry || !collection) continue;
    const excess = Math.max(45, collection.onlineAmount * injectRng.float(0.3, 0.9));
    collection.onlineAmount = Number((collection.onlineAmount + excess).toFixed(2));
    pushAnomaly(
      "DUPLICATE_SALE",
      "trip",
      trip.id,
      excess,
      trip.serviceDate,
      "Remittance exceeds ticket value; possible duplicate posting",
    );
  }

  // 4. Fare mismatch — net does not equal gross minus discount.
  for (let i = 0; i < 320; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    const row = entry?.tickets[0];
    if (!entry || !row) continue;
    const leak = Math.max(35, (row.grossAmount - row.discountAmount) * injectRng.float(0.1, 0.3));
    row.netAmount = Number(Math.max(0, row.netAmount - leak).toFixed(2));
    pushAnomaly(
      "FARE_MISMATCH",
      "trip",
      trip.id,
      leak,
      trip.serviceDate,
      "Net fare does not reconcile with gross fare less discount",
    );
  }

  // 5. Unrecorded trips — bus moved, no ticket record at all.
  for (let i = 0; i < 260; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    if (!entry || entry.tickets.length === 0) continue;
    const est = entry.tickets.reduce((s, t) => s + t.netAmount, 0);
    entry.tickets.forEach((t) => removedTickets.add(t));
    entry.collections.forEach((c) => removedCollections.add(c));
    pushAnomaly(
      "UNRECORDED_TRIP",
      "trip",
      trip.id,
      est,
      trip.serviceDate,
      "Telemetry shows a completed run with no ticket or collection record",
    );
  }

  // 6. Capacity shortfall — demand exceeds seats.
  for (let i = 0; i < 15; i += 1) {
    const trip = nextTrip();
    const entry = tripIndex.get(trip.id);
    if (!entry || entry.tickets.length === 0) continue;
    const multiplier = injectRng.float(1.16, 1.42);
    entry.tickets.forEach((t) => {
      t.ticketsSold = Math.round(t.ticketsSold * multiplier);
      t.grossAmount = Number((t.grossAmount * multiplier).toFixed(2));
      t.discountAmount = Number((t.discountAmount * multiplier).toFixed(2));
      t.netAmount = Number((t.netAmount * multiplier).toFixed(2));
    });
    // More passengers still pay: scale remittances too, so this stays a
    // demand signal and does not masquerade as a revenue variance.
    entry.collections.forEach((c) => {
      c.cashAmount = Number((c.cashAmount * multiplier).toFixed(2));
      c.onlineAmount = Number((c.onlineAmount * multiplier).toFixed(2));
    });
    const extra = Math.round((multiplier - 1) * 45 * 0.35);
    pushAnomaly(
      "CAPACITY_SHORTFALL",
      "trip",
      trip.id,
      extra * 40,
      trip.serviceDate,
      "Boardings exceeded seated capacity; passengers likely turned away",
    );
  }

  // 7. Maintenance risk — km since service far beyond the interval.
  const riskCandidates = injectRng
    .shuffle(vehicles.filter((v) => v.status === "active"))
    .slice(0, 15);
  for (const vehicle of riskCandidates) {
    vehicle.lastServiceKm = Math.max(
      0,
      vehicle.odometerKm - Math.round(vehicle.serviceIntervalKm * injectRng.float(1.55, 2.1)),
    );
    maintenance.push({
      vehicleId: vehicle.id,
      eventDate: addDays(END_DATE, -injectRng.int(1, 25)),
      eventType: "repair",
      odometerKm: vehicle.odometerKm,
      downtimeDays: Number(injectRng.float(0.5, 3).toFixed(1)),
      costInr: Math.round(injectRng.float(12_000, 48_000)),
      faultCode: FAULT_CODES[injectRng.int(0, FAULT_CODES.length - 1)].code,
      severity: "high",
      notes: "Recurring fault; service interval exceeded",
    });
    pushAnomaly(
      "MAINTENANCE_RISK",
      "vehicle",
      vehicle.id,
      Math.round(vehicle.ageYears * 4000 + 18_000),
      addDays(END_DATE, -1),
      "Service interval exceeded with a repeat fault; breakdown likely within 30 days",
    );
  }

  const finalTickets = tickets.filter((t) => !removedTickets.has(t));
  const finalCollections = collections.filter((c) => !removedCollections.has(c));

  /* ---------------------------------------------------------------- */
  /* Derived per-trip finance (what the console reconciles against)    */
  /* ---------------------------------------------------------------- */
  const finance = new Map<
    string,
    {
      ticketRows: number;
      expected: number;
      collected: number;
      missing: number;
      channels: Set<string>;
      fareGap: number;
    }
  >();

  for (const trip of trips) {
    if (trip.status === "cancelled") continue;
    finance.set(trip.id, {
      ticketRows: 0,
      expected: 0,
      collected: 0,
      missing: 0,
      channels: new Set<string>(),
      fareGap: 0,
    });
  }

  const remittedChannels = new Map<string, Set<string>>();
  for (const collection of finalCollections) {
    const entry = finance.get(collection.tripId);
    if (!entry) continue;
    entry.collected += collection.cashAmount + collection.onlineAmount;
    const set = remittedChannels.get(collection.tripId) ?? new Set<string>();
    set.add(collection.channel);
    remittedChannels.set(collection.tripId, set);
  }

  for (const ticket of finalTickets) {
    const entry = finance.get(ticket.tripId);
    if (!entry) continue;
    entry.ticketRows += 1;
    entry.expected += ticket.netAmount;
    const gap = ticket.grossAmount - ticket.discountAmount - ticket.netAmount;
    if (gap > 1) entry.fareGap += gap;
    if (ticket.netAmount > 0 && !remittedChannels.get(ticket.tripId)?.has(ticket.channel)) {
      entry.missing += ticket.netAmount;
      entry.channels.add(ticket.channel);
    }
  }

  const tripFinance: TripFinanceRow[] = Array.from(finance.entries()).map(([tripId, entry]) => ({
    tripId,
    ticketRows: entry.ticketRows,
    expected: Number(entry.expected.toFixed(2)),
    collected: Number(entry.collected.toFixed(2)),
    missingRemittance: Number(entry.missing.toFixed(2)),
    missingChannels: Array.from(entry.channels).join(","),
    fareGap: Number(entry.fareGap.toFixed(2)),
  }));

  const meta: Record<string, string> = {
    seed: String(seed),
    seed_version: SEED_VERSION,
    generated_at: "2026-10-26T10:00:00+05:30",
    window_start: START_DATE,
    window_end: END_DATE,
    fleet_total: String(vehicles.length),
    fleet_out_of_service: String(OUT_OF_SERVICE),
    source_etm: "2026-10-26T08:12:00+05:30",
    source_oprs: "2026-10-26T09:45:00+05:30",
    source_gps: "2026-10-26T09:58:00+05:30",
    source_maintenance: "2026-10-25T18:30:00+05:30",
    disclaimer:
      "Synthetic dataset generated at OSRTC-plausible scale. No real OSRTC records are used.",
  };

  return {
    depots,
    routes,
    vehicles,
    trips,
    tickets: finalTickets,
    collections: finalCollections,
    telemetry,
    maintenance,
    anomalies,
    tripFinance,
    meta,
  };
}
