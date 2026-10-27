import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

export const depots = sqliteTable("depots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  district: text("district").notNull(),
});

export const routes = sqliteTable(
  "routes",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    depotId: text("depot_id")
      .notNull()
      .references(() => depots.id),
    distanceKm: real("distance_km").notNull(),
    routeType: text("route_type", { enum: ["mainline", "rural"] }).notNull(),
    departuresPerDay: integer("departures_per_day").notNull(),
    baseFarePerKm: real("base_fare_per_km").notNull(),
  },
  (t) => [index("idx_routes_depot").on(t.depotId), uniqueIndex("idx_routes_code").on(t.code)],
);

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    registration: text("registration").notNull(),
    model: text("model").notNull(),
    depotId: text("depot_id")
      .notNull()
      .references(() => depots.id),
    capacity: integer("capacity").notNull(),
    ageYears: real("age_years").notNull(),
    odometerKm: integer("odometer_km").notNull(),
    lastServiceKm: integer("last_service_km").notNull(),
    serviceIntervalKm: integer("service_interval_km").notNull(),
    commissionedOn: text("commissioned_on").notNull(),
    status: text("status", { enum: ["active", "maintenance", "idle"] }).notNull(),
  },
  (t) => [index("idx_vehicles_depot").on(t.depotId), index("idx_vehicles_status").on(t.status)],
);

/* ------------------------------------------------------------------ */
/* The atomic unit: a trip                                             */
/* ------------------------------------------------------------------ */

export const trips = sqliteTable(
  "trips",
  {
    id: text("id").primaryKey(),
    routeId: text("route_id")
      .notNull()
      .references(() => routes.id),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    depotId: text("depot_id")
      .notNull()
      .references(() => depots.id),
    serviceDate: text("service_date").notNull(),
    departureTime: text("departure_time").notNull(),
    arrivalTime: text("arrival_time").notNull(),
    scheduledKm: real("scheduled_km").notNull(),
    actualKm: real("actual_km").notNull(),
    status: text("status", { enum: ["completed", "cancelled", "partial"] }).notNull(),
    tripType: text("trip_type", { enum: ["scheduled", "special"] }).notNull(),
  },
  (t) => [
    index("idx_trips_date").on(t.serviceDate),
    index("idx_trips_route").on(t.routeId, t.serviceDate),
    index("idx_trips_vehicle").on(t.vehicleId, t.serviceDate),
    index("idx_trips_depot").on(t.depotId, t.serviceDate),
  ],
);

/** What was sold, per channel, per trip. */
export const tickets = sqliteTable(
  "tickets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id),
    channel: text("channel", { enum: ["etm", "oprs", "counter"] }).notNull(),
    ticketsSold: integer("tickets_sold").notNull(),
    grossAmount: real("gross_amount").notNull(),
    discountAmount: real("discount_amount").notNull(),
    netAmount: real("net_amount").notNull(),
  },
  (t) => [index("idx_tickets_trip").on(t.tripId)],
);

/** What was actually remitted, per channel, per trip. */
export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id),
    channel: text("channel", { enum: ["etm", "oprs", "counter"] }).notNull(),
    cashAmount: real("cash_amount").notNull(),
    onlineAmount: real("online_amount").notNull(),
    remittedOn: text("remitted_on"),
    syncStatus: text("sync_status", { enum: ["synced", "pending", "failed"] }).notNull(),
  },
  (t) => [index("idx_collections_trip").on(t.tripId)],
);

export const telemetry = sqliteTable(
  "telemetry",
  {
    tripId: text("trip_id")
      .primaryKey()
      .references(() => trips.id),
    gpsPoints: integer("gps_points").notNull(),
    distanceKm: real("distance_km").notNull(),
    avgSpeedKmph: real("avg_speed_kmph").notNull(),
    maxSpeedKmph: real("max_speed_kmph").notNull(),
    idleMinutes: integer("idle_minutes").notNull(),
    gpsGapMinutes: integer("gps_gap_minutes").notNull(),
    lastPing: text("last_ping").notNull(),
  },
  (t) => [index("idx_telemetry_lastping").on(t.lastPing)],
);

export const maintenance = sqliteTable(
  "maintenance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    eventDate: text("event_date").notNull(),
    eventType: text("event_type", {
      enum: ["service", "repair", "breakdown", "inspection"],
    }).notNull(),
    odometerKm: integer("odometer_km").notNull(),
    downtimeDays: real("downtime_days").notNull(),
    costInr: real("cost_inr").notNull(),
    faultCode: text("fault_code"),
    severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
    notes: text("notes"),
  },
  (t) => [index("idx_maintenance_vehicle").on(t.vehicleId, t.eventDate)],
);

/** Ground truth. Written only by the seed; the UI scores itself against this. */
export const anomalies = sqliteTable(
  "anomalies",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type", { enum: ["trip", "vehicle"] }).notNull(),
    entityId: text("entity_id").notNull(),
    kind: text("kind").notNull(),
    rupeesImpact: real("rupees_impact").notNull(),
    injectedOn: text("injected_on").notNull(),
    note: text("note"),
  },
  (t) => [index("idx_anomalies_entity").on(t.entityId), index("idx_anomalies_kind").on(t.kind)],
);

/** Human workflow on top of a detection. */
export const cases = sqliteTable(
  "cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseKey: text("case_key").notNull(),
    tripId: text("trip_id"),
    kind: text("kind").notNull(),
    rupeesImpact: real("rupees_impact").notNull(),
    status: text("status", { enum: ["open", "acknowledged", "assigned", "resolved"] })
      .notNull()
      .default("open"),
    assignee: text("assignee"),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("idx_cases_key").on(t.caseKey), index("idx_cases_status").on(t.status)],
);

/**
 * Derived per-trip finance, written once by the seed.
 * Reconciliation reads this instead of re-aggregating half a million rows
 * on every page load; the rules themselves still live in src/core.
 */
export const tripFinance = sqliteTable("trip_finance", {
  tripId: text("trip_id")
    .primaryKey()
    .references(() => trips.id),
  ticketRows: integer("ticket_rows").notNull(),
  expected: real("expected").notNull(),
  collected: real("collected").notNull(),
  missingRemittance: real("missing_remittance").notNull(),
  missingChannels: text("missing_channels").notNull(),
  fareGap: real("fare_gap").notNull(),
});

export const seedMeta = sqliteTable("seed_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type Depot = typeof depots.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Telemetry = typeof telemetry.$inferSelect;
export type MaintenanceEvent = typeof maintenance.$inferSelect;
export type Anomaly = typeof anomalies.$inferSelect;
export type CaseRow = typeof cases.$inferSelect;
