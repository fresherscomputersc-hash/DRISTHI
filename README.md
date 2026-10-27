# Drishti — OSRTC Operations Intelligence

A real-time operations console for the **Odisha State Road Transport Corporation**, built for
**OSFIC 2026 · PS #182 (Commerce & Transport Department)**.

Drishti joins OSRTC's siloed operational data — ETM ticketing, OPRS bookings, GPS telemetry and
workshop logs — into one trip-level truth, then turns it into four decisions: **what demand will be,
where to deploy the fleet, which vehicles will fail, and where revenue is leaking.**

Every alert is explainable and actionable. Open any row and you get the underlying records, the rule
or model that fired, the confidence, and the rupee or vehicle impact. If the evidence panel fails,
the product fails — so evidence is part of the data model, not a tooltip added later.

---

## Quick start

```bash
npm install
npm run seed      # deterministic synthetic dataset → data/drishti.db (~35 s, 79 MB)
npm run dev       # http://localhost:3000
```

- Node ≥ 20, npm ≥ 10.
- **No network, no API keys, no external services at runtime.** Fonts are bundled; the database is local.
- The dataset is generated from a fixed seed, so every number in this README reproduces exactly.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the console |
| `npm run build` / `npm start` | Production build and serve |
| `npm run seed` | Rebuild `data/drishti.db` from the generator |
| `npm run seed:reset` | Same, deleting the existing file first |
| `npm run verify` | Print the detection scorecard against injected ground truth |
| `npm test` | Unit tests for the reconciliation, forecasting and risk engines |
| `npm run e2e` | Playwright: the six-step demo path end to end (dev-time only) |
| `npm run typecheck` | `tsc --noEmit` |

---

## The four modules

| Module | The decision it supports | What you see |
|---|---|---|
| **Command Center** | *What needs attention this morning?* | Revenue, revenue at risk, fleet availability, load factor; alerts ranked by rupees; fleet mix; source freshness; depot table |
| **Revenue Integrity** (deep) | *Where is money leaking, and what do we do about it?* | Trip-level reconciliation ledger, five classified causes, evidence drawer, case workflow, measured detection scorecard |
| **Demand Intelligence** | *Where will seats be short or empty next week?* | Seven-day forecast per route with an error band, backtested MAPE, capacity-gap recommendation, network deployment board |
| **Fleet & Maintenance** | *Which buses will fail, and why?* | Weighted risk score with its five factors, service-overdue list, workshop history, route utilisation and dead-km |

A **Data Quality** view states what the console knows, how stale each source is, which integrity
checks fail, and what the synthetic dataset assumes.

### Revenue Integrity — the five causes

Reconciliation runs per trip: ticket value issued versus value remitted, with a **₹25 tolerance** so
natural rounding is not treated as fraud. Classification is by dominant cause, in this order:

| Cause | Rule | Why it matters |
|---|---|---|
| `ETM_SYNC_FAILURE` | A ticketing channel has value but no remittance row | Batch upload failed; money exists but the ledger never sees it |
| `UNRECORDED_TRIP` | Telemetry shows movement, no ticket or collection rows exist | The bus ran and carried passengers off-book |
| `UNDER_COLLECTION` | Remitted cash is below issued ticket value | Classic cash leakage between conductor and depot |
| `DUPLICATE_SALE` | Remitted value exceeds ticket value | Double posting, or a sale booked twice |
| `FARE_MISMATCH` | Net fare ≠ gross − concession | Rate table or concession applied incorrectly |

Each detection carries a confidence, a numbered rule trace, and the exact ticket / remittance /
telemetry rows that produced it. Cases (status, assignee, note) are stored separately from detections,
so a case update never invalidates a detection result.

### Demand — the model, stated plainly

Additive **Holt-Winters** with a weekly season (α 0.35, β 0.08, γ 0.30), fitted per route on up to 90
days of boardings. The shaded band comes from the residual spread, widened by horizon. Error is a real
**14-day hold-out**, not a training score. Below 28 days of history the model **refuses** and the UI
says so rather than printing a number it cannot defend.

Capacity gaps fire only at the edges: demand exceeds seats (add trips) or fills **40% or less**
(trim / downsize). Between those bands, the schedule stays. On this dataset that is **18 routes short
of seats and 42 running light — ₹1.13 lakh a day** of fare value at stake, ranked by route.

### Fleet — the score, stated plainly

`risk = service interval (30) + breakdowns in 90d (25) + age (20) + repeat repairs (15) + last fault severity (10)`

Bands: **≥70 critical, 50–69 high, 30–49 moderate, <30 low**. Every vehicle in the drawer decomposes
into those five factors with the arithmetic shown, plus a recommendation and the workshop events that
justify it.

---

## Measured detection quality

The generator injects labelled anomalies, so detection is measured rather than asserted. `npm run verify`:

| Metric | Result |
|---|---|
| Injected revenue anomalies on trips (90 days) | 2,040 |
| Detected | 2,040 |
| False positives | 0 |
| Precision / recall / F1 | 100% / 100% / 100% |
| Rupees detected | ₹9.76 lakh |
| Rupee recall | 96.9% |

Two honest notes:

1. **Perfect count recall is expected on this dataset.** The rules encode the same failure mechanisms
   the generator injects, and the generator does not inject plausible-but-innocent variances. The real
   test is a pilot against OSRTC's remittance lag, which will produce false positives until the
   tolerance and the lag window are recalibrated.
2. **Rupee recall is below 100%** because an unrecorded trip has no ticket row to read: its value is
   estimated from fare-per-km and distance, so it lands near — not exactly on — the injected amount.

The dataset also contains **15 capacity shortfalls** and **15 vehicle-level maintenance risks**, which
sit outside the revenue scorecard above: capacity gaps surface in Demand, maintenance risk in Fleet.

---

## Data

Synthetic, generated at OSRTC-plausible scale with documented assumptions:

| Entity | Volume |
|---|---|
| Vehicles | 1,999 (577 mainline, 1,422 rural; 109 out of service) |
| Routes / depots | 192 routes, 12 depots |
| Window | 90 days · 28 Jul – 25 Oct 2026 (IST) |
| Trips | 123,300 (~1,370/day) |
| Tickets / remittances | ~270,000 rows each |
| Telemetry | one row per trip, with realistic GPS gaps |
| Anomalies | 2,070 labelled — 2,040 revenue, 15 capacity shortfall, 15 maintenance risk |

Why synthetic: real OSRTC ticketing data is not public, and a demo cannot claim precision without
labels. The generator writes the label *and* the corrupted rows, so precision and recall are computed,
not asserted. Every assumption is listed in `.planning/PROJECT.md` and on the Data Quality page.

---

## Architecture

```
src/core/          pure TypeScript engines — reconcile, forecast, risk, recommend, scorecard
src/db/            Drizzle schema, SQLite client, deterministic seed generator
src/server/        read queries (SQL) and one server action (case workflow)
src/app/           Next.js App Router routes: /, /revenue, /demand, /fleet, /data-quality
src/components/    shell, UI primitives, charts, evidence drawer, forms
scripts/           verify-detection (scorecard), seed helpers
```

- **Next.js 15 (App Router) + React 19 + TypeScript (strict)** — one process for UI and data access;
  SQLite never ships to the browser.
- **SQLite via better-sqlite3, Drizzle schema** — zero-install, synchronous reads, deterministic.
- **Recharts** for forecast bands and trends; **Tailwind** with a small set of shadcn-style primitives.
- **Vitest** for the engines; **Playwright** for the demo path.

Two performance decisions worth naming:

1. `trip_finance` is pre-aggregated at seed time (ticket rows, expected, remitted, missing remittance,
   fare gap per trip). Reconciliation then scans 123k indexed rows instead of aggregating 540k detail
   rows on every page load — measured **1.8 s → 0.11 s**.
2. Detection results are memoised per window because the dataset is immutable; cases are read
   separately so a case update cannot serve a stale detection.

---

## Tests

```bash
npm test                        # 26 unit tests: reconciliation, forecast, risk
npm run verify                  # detection scorecard against injected ground truth
npm run build && npm run e2e    # Playwright: the six-step demo path
```

The end-to-end suite reuses a server already listening on `:3000` — a production `npm start` is ideal —
or starts the dev server itself. Browsers are a one-time dev install
(`npx playwright install chromium`); nothing at runtime needs them, or the network.

---

## What this deliberately does not claim

- It is **not live OSRTC data**, and the UI says so on every page.
- It does **not** integrate with an ETM or OPRS endpoint; the ingestion contract is modelled, not built.
- The forecast is a univariate seasonal model. It has no weather, festival or holiday regressors —
  a pilot should add them before trusting a holiday week.
- Detection tolerance and remittance lag are tuned to this dataset; a pilot must recalibrate both.

---

## Demo

A 90-second walkthrough (what to click, in order, and what to say) is in [`docs/DEMO.md`](docs/DEMO.md).
