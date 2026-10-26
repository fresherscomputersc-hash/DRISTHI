# Architecture Research — Drishti

## Shape

Single Next.js application, four internal layers, one SQLite file. No services, no queues, no network calls.

```
┌─────────────────────────────────────────────────────────┐
│  App Router (server components by default)               │
│  /, /revenue, /demand, /fleet, /data-quality            │
│  + client islands: charts, drawers, filters, case forms  │
├─────────────────────────────────────────────────────────┤
│  Query layer  (src/server/queries/*)                     │
│  Drizzle typed reads → view models (no raw rows to UI)   │
├─────────────────────────────────────────────────────────┤
│  Analytics engine  (src/core/*)  — pure, no I/O          │
│  reconcile() · classify() · forecast() · riskScore()     │
│  NaN-safe, deterministic, unit-tested                    │
├─────────────────────────────────────────────────────────┤
│  Data layer  (src/db/*)                                  │
│  schema.ts · client.ts · seed/ (generator + ground truth) │
└─────────────────────────────────────────────────────────┘
```

## Data Model — trip is the atomic unit

| Table | Grain | Key fields |
|---|---|---|
| `routes` | route | id, code, name, origin, destination, depot, distance_km, scheduled_km |
| `depots` | depot | id, name, region, district |
| `vehicles` | bus | id, registration, model, depot_id, age_years, odometer_km, last_service_km, status |
| `trips` | one scheduled run | id, route_id, vehicle_id, depot_id, service_date, departure_time, arrival_time, scheduled_km, actual_km, status |
| `tickets` | trip × channel aggregate | trip_id, channel (oprs/etm/counter), tickets_sold, gross_amount, discount_amount, net_amount |
| `collections` | trip × channel remittance | trip_id, channel, cash_amount, online_amount, remitted_on |
| `telemetry` | trip summary | trip_id, gps_points, distance_km, avg_speed, max_speed, idle_minutes, gps_gap_minutes |
| `maintenance` | event | id, vehicle_id, event_date, type (service/repair/breakdown), odometer, downtime_days, cost, fault_code, notes |
| `anomalies` | ground truth (seed only) | id, trip_id/vehicle_id, kind, injected_value, rupee_impact, detected_by |
| `cases` | workflow | id, anomaly_key, status, assignee, note, created_at, resolved_at |

**Why trips:** ticketing, telematics, maintenance, and revenue all describe a trip or a vehicle. Route-level and depot-level views are aggregations, never separate sources of truth.

## Analytics Modules (pure functions, no DB access)

| Module | Input | Output |
|---|---|---|
| `reconcile.ts` | tickets[] + collections[] | expected vs collected vs variance per trip/channel |
| `classify.ts` | variance + telemetry + timing | anomaly kind + confidence + reason codes |
| `forecast.ts` | historical boardings by route×dow×hour | point forecast + interval + MAPE from backtest |
| `utilization.ts` | trips + capacity | load factor, dead-km ratio, idle time |
| `risk.ts` | vehicle age, km since service, fault history | 0–100 score + top 3 contributing factors |
| `recommend.ts` | forecast + capacity + fleet state | add/trim/redeploy suggestions + expected ₹ |
| `scorecard.ts` | detections vs `anomalies` | precision, recall, ₹ recovered |

## Rendering Strategy

- **Server components** for every page: data is read at request time from SQLite, no client fetching, no loading spinners for first paint.
- **Client islands** only where interaction demands it: chart tooltips, filter state, evidence drawer, case mutation.
- **Mutations** via server actions; revalidate the affected path only.
- **No global state library** — URL search params are the filter state (shareable, back-button correct).

## Key Boundaries

- `src/core/*` must never import from `src/db/*` or `next/*` — this is enforced by review, and is what makes Vitest tests trivial.
- Every page-level KPI must be reproducible by a named function in `src/server/queries/*`; the evidence drawer calls the same function with a narrower filter.
- Seed is idempotent and versioned (`SEED_VERSION`) so a stale DB is detected and rebuilt.

## Deployment (demo)

- `npm run dev` locally, or `npm run build && npm start` on any laptop.
- No env vars required. Optional `DRISHTI_DB_PATH` to point at a different SQLite file.
- Database file is regenerable from seed code; never commit the binary.
