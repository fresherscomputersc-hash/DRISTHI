---
gsd_state_version: '1.0'
status: complete
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 17
  completed_plans: 16
  percent: 96
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-27)

**Core value:** Every alert is explainable and actionable — evidence rows, rule trace, and rupee impact behind every number.
**Current focus:** Phase 6 — Hardening & demo (Playwright, README, demo script done; CSV import deferred)

## Current Position

Phase: 6 of 6 (Hardening & Demo)
Plan: 16 of 17 complete; 06-01 (CSV import) deferred by decision
Status: Demo-ready
Last activity: 2026-10-27 — anomaly scale raised to 2,070 labelled; 6/6 Playwright demo-path tests green; README + docs/DEMO.md written

Progress: [█████████░] 96%

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: —
- Total execution time: ~2 days (hackathon pace)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3 | 3 | — |
| 2. Analytics core | 3 | 3 | — |
| 3. Command Center | 2 | 2 | — |
| 4. Revenue Integrity | 3 | 3 | — |
| 5. Demand & Fleet | 3 | 3 | — |
| 6. Hardening | 2 | 3 | — |

## Accumulated Context

### Decisions

- [Init]: Scope = all four PS pillars, deep on Revenue Integrity.
- [Init]: SQLite + deterministic seeded generator; no live pipeline.
- [Init]: Analytics in pure TypeScript, not a Python service.
- [Init]: Synthetic data is disclosed in-app; detection measured against injected ground truth.
- [P1]: Fonts bundled locally (`next/font/local`, Atkinson Hyperlegible) — no network fetch at runtime.
- [P2]: `trip_finance` pre-aggregated at seed time in JS (SQL variant took 153 s); reconciliation scans 123k indexed rows, not 540k detail rows.
- [P2]: Detections memoised per window in a module-level map (dataset immutable); cases read separately so a case update never invalidates a detection.
- [P2]: Detection tolerance ₹25; five revenue kinds, plus capacity shortfall and maintenance risk as separate labels.
- [P1]: Anomaly injection scaled to 2,070 labelled cases (2,040 revenue) so the headline rupee figure is material: ₹9.76 L over 90 days, 96.9% rupee recall.
- [P5]: Per-route demand heterogeneity (`routePull`) — without it every route sat at 58–75% load and the capacity-gap rule never fired.
- [P5]: Seats and sales aggregated in separate queries everywhere a tickets join would multiply vehicle rows (demand, depots, utilisation, vehicle detail).
- [P5]: Demand board memoised per process; the Command Center strip reads it so the forecast is visible before opening the module.
- [P6]: Every route is `force-dynamic`; the dataset is read at request time and nothing is prerendered.
- [P6]: Playwright reuses a server already on :3000, otherwise starts the dev server.

### Pending Todos

- DATA-01 CSV import (deferred — ingestion contract is documented, not built).
- Optional: reduce `/revenue` HTML weight (150 rows ≈ 750 KB) via paging.

### Blockers/Concerns

- No real OSRTC data (expected; synthetic only).
- Detection precision is exact on this dataset by construction; a pilot must recalibrate tolerance and remittance lag.

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Data | CSV import with row-level validation (DATA-01) | Deferred | 2026-10-27 | v1 |
| UI | Revenue ledger paging to cut HTML weight | Deferred | 2026-10-27 | v1 |

## Session Continuity

Last session: 2026-10-27
Stopped at: Demo-ready; seed, build, unit tests, detection scorecard and Playwright all green
Resume file: docs/DEMO.md
