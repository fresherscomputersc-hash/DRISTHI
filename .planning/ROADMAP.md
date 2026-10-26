# Roadmap: Drishti — OSRTC Operations Intelligence

## Overview

Six phases take Drishti from an empty repository to a demonstrable operations-intelligence console: first the trip-level data foundation and design system, then the tested analytics core, then the executive command center, then the deep Revenue Integrity workflow, then Demand + Fleet/Maintenance, and finally hardening plus the demo script. Each phase ends in something a judge can be shown — because the judging date may move.

## Phases

- [ ] **Phase 1: Foundation & Design System** - Next.js scaffold, tokens, app shell, SQLite trip model, deterministic seeded generator
- [ ] **Phase 2: Analytics Core & Ground Truth** - Reconciliation, classification, forecasting, risk scoring, tested; detection scorecard
- [ ] **Phase 3: Command Center** - Executive situational view, rupee-ranked alert feed, data freshness
- [ ] **Phase 4: Revenue Integrity** - Deep leakage workflow with evidence panels and case lifecycle
- [ ] **Phase 5: Demand & Fleet** - Forecast board, capacity gaps, utilization, maintenance risk, redeployment
- [ ] **Phase 6: Hardening & Demo** - CSV import, data quality, a11y, Playwright, README + demo script

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: A running app shell with the real data model, design tokens, and a deterministic seed — the ground everything else stands on.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app on a clean machine with no keys and no network
  2. `npm run seed` reproducibly builds the SQLite dataset; running it twice yields identical counts
  3. Dataset contains 1,999 vehicles, ~180 routes, 90 days of trips, and ~240 labeled anomalies
  4. App shell renders the four-persona navigation with tokens applied and no layout shift
  5. A `/api/health` style check confirms DB connectivity and seed version
**Plans**: 3 plans

Plans:
- [ ] 01-01: Next.js scaffold, Tailwind + shadcn setup, design tokens, app shell and persona switcher
- [ ] 01-02: Drizzle schema, SQLite client, indexes, and seed versioning
- [ ] 01-03: Deterministic generator: routes, depots, vehicles, trips, tickets, collections, telemetry, maintenance, injected anomalies

### Phase 2: Analytics Core & Ground Truth
**Goal**: Pure, tested analytics that turn the trip model into decisions — and prove their own accuracy.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: EXP-01, EXP-02
**Success Criteria** (what must be TRUE):
  1. `npm test` passes with unit coverage on reconciliation, classification, forecasting, utilization, and risk
  2. Reconciliation detects ≥85% of injected leakage with ≤5% false positives on the seeded dataset
  3. Forecast backtest reports MAPE per route and refuses to forecast routes below the data threshold
  4. Every analytics output carries a method string, inputs snapshot, and confidence
  5. Detection scorecard is computable from code alone (no manual numbers)
**Plans**: 3 plans

Plans:
- [ ] 02-01: Reconciliation + anomaly classification engine with reason codes
- [ ] 02-02: Holt-Winters demand forecast, backtest harness, capacity-gap detection
- [ ] 02-03: Utilization, breakdown-risk scoring, recommendation engine, ground-truth scorecard

### Phase 3: Command Center
**Goal**: A single screen that gives OSRTC leadership the ten-second read, and routes them to the evidence.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. Executive sees fleet availability, revenue at risk, demand outlook, and open alerts on first paint
  2. Every KPI card links to the module with the matching filter state in the URL
  3. Alert feed sorts by rupee impact by default and shows source freshness
  4. Freshness badges reflect actual per-source sync age from the seed
  5. Page renders without client-side fetching or layout shift
**Plans**: 2 plans

Plans:
- [ ] 03-01: KPI computation queries + card components with provenance chips
- [ ] 03-02: Rupee-ranked alert feed, freshness strip, persona-aware defaults

### Phase 4: Revenue Integrity
**Goal**: The provable centrepiece — detect leakage, explain it, and close it.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05, REV-06
**Success Criteria** (what must be TRUE):
  1. Finance user sees a filterable ledger of trip-level variances with channel breakdown
  2. Each row shows anomaly class, confidence, and rupee impact
  3. Evidence drawer lists contributing ticket, collection, and telemetry rows plus the rule trace
  4. A case can move Open → Acknowledged → Assigned → Resolved and persists across reload
  5. Recoverable-₹ rollup and precision/recall scorecard reconcile with the ground-truth table
**Plans**: 3 plans

Plans:
- [ ] 04-01: Revenue ledger, filters, variance table, rupee formatting
- [ ] 04-02: Evidence drawer with provenance chain and rule trace rendering
- [ ] 04-03: Case workflow (server actions), recoverable-₹ rollup, scorecard panel

### Phase 5: Demand & Fleet
**Goal**: Deliver the remaining three PS verbs as decisions, not charts.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: DEM-01, DEM-02, DEM-03, DEM-04, FLT-01, FLT-02, FLT-03, FLT-04
**Success Criteria** (what must be TRUE):
  1. Operations user can pick route + date and see 7-day forecast with confidence band and historical actuals
  2. Capacity-gap flags appear with a stated recommendation and expected daily ₹ impact
  3. Maintenance user sees a ranked risk list with top contributing factors per vehicle
  4. Service-due queue is ordered by risk and km since service
  5. Redeployment suggestions reference the forecast gap that motivated them
**Plans**: 3 plans

Plans:
- [ ] 05-01: Demand board: forecast chart, MAPE panel, capacity-gap list
- [ ] 05-02: Fleet utilization views and vehicle detail
- [ ] 05-03: Maintenance risk queue and redeployment recommendations

### Phase 6: Hardening & Demo
**Goal**: Make it survive a judging laptop, a projector, and a skeptical domain expert.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. CSV import validates and reports row-level errors without corrupting the dataset
  2. Data quality page shows missing telemetry, unlinked tickets, stale syncs, and orphans
  3. Playwright covers the demo path end to end
  4. Accessibility pass: keyboard navigation, focus states, contrast, no color-only encoding
  5. README contains setup in three commands and a timed 90-second demo script
**Plans**: 3 plans

Plans:
- [ ] 06-01: CSV import with validation and data quality report
- [ ] 06-02: Empty/loading/error states, a11y pass, responsive check
- [ ] 06-03: Playwright demo-path test, README, demo script, graphify refresh

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 0/3 | Not started | - |
| 2. Analytics Core & Ground Truth | 0/3 | Not started | - |
| 3. Command Center | 0/2 | Not started | - |
| 4. Revenue Integrity | 0/3 | Not started | - |
| 5. Demand & Fleet | 0/3 | Not started | - |
| 6. Hardening & Demo | 0/3 | Not started | - |
