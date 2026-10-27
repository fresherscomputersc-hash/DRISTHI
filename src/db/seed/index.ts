import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DB_PATH } from "../client";
import { DAYS, END_DATE, SEED, SEED_VERSION, START_DATE, buildDataset } from "./generate";

const DDL = `
CREATE TABLE IF NOT EXISTS depots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depot_id TEXT NOT NULL REFERENCES depots(id),
  distance_km REAL NOT NULL,
  route_type TEXT NOT NULL,
  departures_per_day INTEGER NOT NULL,
  base_fare_per_km REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  registration TEXT NOT NULL,
  model TEXT NOT NULL,
  depot_id TEXT NOT NULL REFERENCES depots(id),
  capacity INTEGER NOT NULL,
  age_years REAL NOT NULL,
  odometer_km INTEGER NOT NULL,
  last_service_km INTEGER NOT NULL,
  service_interval_km INTEGER NOT NULL,
  commissioned_on TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  depot_id TEXT NOT NULL REFERENCES depots(id),
  service_date TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  scheduled_km REAL NOT NULL,
  actual_km REAL NOT NULL,
  status TEXT NOT NULL,
  trip_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  channel TEXT NOT NULL,
  tickets_sold INTEGER NOT NULL,
  gross_amount REAL NOT NULL,
  discount_amount REAL NOT NULL,
  net_amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  channel TEXT NOT NULL,
  cash_amount REAL NOT NULL,
  online_amount REAL NOT NULL,
  remitted_on TEXT,
  sync_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry (
  trip_id TEXT PRIMARY KEY REFERENCES trips(id),
  gps_points INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  avg_speed_kmph REAL NOT NULL,
  max_speed_kmph REAL NOT NULL,
  idle_minutes INTEGER NOT NULL,
  gps_gap_minutes INTEGER NOT NULL,
  last_ping TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  odometer_km INTEGER NOT NULL,
  downtime_days REAL NOT NULL,
  cost_inr REAL NOT NULL,
  fault_code TEXT,
  severity TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS anomalies (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  rupees_impact REAL NOT NULL,
  injected_on TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS trip_finance (
  trip_id TEXT PRIMARY KEY REFERENCES trips(id),
  ticket_rows INTEGER NOT NULL,
  expected REAL NOT NULL,
  collected REAL NOT NULL,
  missing_remittance REAL NOT NULL,
  missing_channels TEXT NOT NULL,
  fare_gap REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_key TEXT NOT NULL UNIQUE,
  trip_id TEXT,
  kind TEXT NOT NULL,
  rupees_impact REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  assignee TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seed_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_depot ON routes(depot_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_depot ON vehicles(depot_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(service_date);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id, service_date);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id, service_date);
CREATE INDEX IF NOT EXISTS idx_trips_depot ON trips(depot_id, service_date);
CREATE INDEX IF NOT EXISTS idx_tickets_trip ON tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_collections_trip ON collections(trip_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_lastping ON telemetry(last_ping);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id, event_date);
CREATE INDEX IF NOT EXISTS idx_anomalies_entity ON anomalies(entity_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_kind ON anomalies(kind);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
`;

function main() {
  const reset = process.argv.includes("--reset");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (reset) {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      const file = DB_PATH + suffix;
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }

  const t0 = Date.now();
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = OFF");
  sqlite.pragma("foreign_keys = OFF");

  sqlite.exec(`
    DROP TABLE IF EXISTS cases;
    DROP TABLE IF EXISTS trip_finance;
    DROP TABLE IF EXISTS anomalies;
    DROP TABLE IF EXISTS maintenance;
    DROP TABLE IF EXISTS telemetry;
    DROP TABLE IF EXISTS collections;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS trips;
    DROP TABLE IF EXISTS vehicles;
    DROP TABLE IF EXISTS routes;
    DROP TABLE IF EXISTS depots;
    DROP TABLE IF EXISTS seed_meta;
  `);
  sqlite.exec(DDL);

  console.log(`→ building dataset (seed ${SEED}, ${DAYS} days ${START_DATE} → ${END_DATE})`);
  const data = buildDataset(SEED);
  console.log(
    `  routes=${data.routes.length} vehicles=${data.vehicles.length} trips=${data.trips.length} anomalies=${data.anomalies.length}`,
  );

  const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

  const insert = <T extends object>(table: string, rows: T[]) => {
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0] as Record<string, unknown>);
    const cols = keys.map(snake).join(", ");
    const placeholders = keys.map((k) => `@${snake(k)}`).join(", ");
    const stmt = sqlite.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`);
    const tx = sqlite.transaction((batch: T[]) => {
      for (const row of batch) {
        const params: Record<string, unknown> = {};
        for (const key of keys) params[snake(key)] = (row as Record<string, unknown>)[key];
        stmt.run(params);
      }
    });
    tx(rows);
  };

  sqlite.transaction(() => {
    insert("depots", data.depots);
    insert("routes", data.routes);
    insert("vehicles", data.vehicles);
    insert("trips", data.trips);
    insert("tickets", data.tickets);
    insert("collections", data.collections);
    insert("telemetry", data.telemetry);
    insert("maintenance", data.maintenance);
    insert("anomalies", data.anomalies);
    insert("trip_finance", data.tripFinance);

    const metaStmt = sqlite.prepare("INSERT INTO seed_meta (key, value) VALUES (?, ?)");
    const meta = { ...data.meta, seed_version: SEED_VERSION };
    for (const [key, value] of Object.entries(meta)) metaStmt.run(key, value);
  })();

  // ANALYZE gives the planner accurate row counts for the reconciliation scan.
  sqlite.exec("ANALYZE;");

  // Cases for the highest-value detected events are seeded lazily by the app;
  // the table starts empty so the workflow is genuinely exercised in the demo.

  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  sqlite.close();

  const sizeMb = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`✓ seeded ${DB_PATH} (${sizeMb} MB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
