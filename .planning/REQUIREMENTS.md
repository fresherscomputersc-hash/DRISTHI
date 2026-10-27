# Requirements: Drishti — OSRTC Operations Intelligence

**Defined:** 2026-10-26
**Core Value:** Every alert is explainable and actionable — evidence rows, rule trace, and rupee impact behind every number.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: App runs offline from a single command with no API keys or external services
- [x] **FOUND-02**: Seeded dataset is deterministic, versioned, and OSRTC-plausible (1,999 vehicles, ~180 routes, 90 days, ~135k trips)
- [x] **FOUND-03**: Seed injects 2,070 labeled anomalies (2,040 revenue) with rupee impact for ground-truth scoring
- [x] **FOUND-04**: User can switch between four personas (Executive, Operations, Maintenance, Finance) without authentication
- [x] **FOUND-05**: Trip is the atomic data unit; every module reads the same trip model

### Command Center

- [x] **CMD-01**: User sees fleet availability, revenue at risk, demand outlook, and open alerts on one screen
- [x] **CMD-02**: Every KPI card opens the module and filter state that produced it
- [x] **CMD-03**: Alert feed is ranked by rupee impact, not recency
- [x] **CMD-04**: Per-source data freshness is visible with sync age

### Revenue Integrity

- [x] **REV-01**: Finance user can see trip-level reconciliation of ticket sales vs cash + online collections
- [x] **REV-02**: Each mismatch is classified as sync failure, under-collection, duplicate sale, fare mismatch, or unrecorded trip
- [x] **REV-03**: Each mismatch has a confidence score and reason codes
- [x] **REV-04**: Finance user can open an evidence panel showing contributing rows and the rule that fired
- [x] **REV-05**: Finance user can acknowledge, assign, and resolve a case with a note
- [x] **REV-06**: User sees total recoverable ₹ and detection precision/recall against ground truth

### Demand Intelligence

- [x] **DEM-01**: Operations user can see boardings forecast by route, day, and hour for the next 7 days
- [x] **DEM-02**: Every forecast shows a confidence band and backtested MAPE
- [x] **DEM-03**: System flags capacity gaps where forecast load factor >100% or <40%
- [x] **DEM-04**: System recommends adding or trimming trips with expected daily rupee impact

### Fleet & Maintenance

- [x] **FLT-01**: User can see utilization per vehicle and route (load factor, dead-km ratio, idle time)
- [x] **FLT-02**: Maintenance user can see a 0–100 breakdown-risk score per vehicle with top contributing factors
- [x] **FLT-03**: Service-due queue is prioritized by risk and km since last service
- [x] **FLT-04**: System suggests redeployments (move vehicle between routes/depots) grounded in forecast gaps

### Explainability & Data

- [x] **EXP-01**: Every alert, KPI, and forecast exposes source rows on demand
- [x] **EXP-02**: Every model output states its method, inputs, and confidence
- [ ] **DATA-01**: Analyst can import CSV extracts for trips, tickets, and maintenance with validation errors surfaced — *deferred; the ingestion contract is documented on the Data Quality page*
- [x] **DATA-02**: Data quality report shows missing telemetry, unlinked tickets, stale syncs, and orphan records

## v2 Requirements

### Access & Operations

- **AUTH-01**: Role-based authentication with OSRTC directory integration
- **AUTH-02**: Audit trail of every case action and data import

### Integration

- **INTG-01**: Read-only connector to ITMS/OPRS databases or exports
- **INTG-02**: Scheduled nightly ingest with failure alerting

### Delivery

- **DLVR-01**: Email/SMS digest of top alerts for depot managers
- **DLVR-02**: PDF export of weekly operations review
- **DLVR-03**: Odia localization of the UI
- **DLVR-04**: Mobile-responsive field view for depot supervisors

### Analytics

- **ANLT-01**: OR-Tools-based schedule optimization
- **ANLT-02**: Anomaly detection learned from OSRTC history rather than rules

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live GPS streaming map | No real telemetry feed exists; a simulated moving map would destroy credibility with OSRTC judges |
| Deep-learning demand model | PS asks for decisions; explainability beats sophistication and training is non-deterministic at demo time |
| Passenger-facing app | PS is explicitly management-facing |
| PII storage | Government data sensitivity; trip-level aggregation is sufficient for every requirement |
| Multi-tenant SaaS | Not the PS; adds auth/billing surface with zero judging value |
| Microservices / message bus | Absurd at 135k-row scale; signals poor technical judgment |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Done |
| FOUND-02 | Phase 1 | Done |
| FOUND-03 | Phase 1 | Done |
| FOUND-04 | Phase 1 | Done |
| FOUND-05 | Phase 1 | Done |
| CMD-01 | Phase 3 | Done |
| CMD-02 | Phase 3 | Done |
| CMD-03 | Phase 3 | Done |
| CMD-04 | Phase 3 | Done |
| REV-01 | Phase 4 | Done |
| REV-02 | Phase 4 | Done |
| REV-03 | Phase 4 | Done |
| REV-04 | Phase 4 | Done |
| REV-05 | Phase 4 | Done |
| REV-06 | Phase 4 | Done |
| DEM-01 | Phase 5 | Done |
| DEM-02 | Phase 5 | Done |
| DEM-03 | Phase 5 | Done |
| DEM-04 | Phase 5 | Done |
| FLT-01 | Phase 5 | Done |
| FLT-02 | Phase 5 | Done |
| FLT-03 | Phase 5 | Done |
| FLT-04 | Phase 5 | Done |
| EXP-01 | Phase 2 | Done |
| EXP-02 | Phase 2 | Done |
| DATA-01 | Phase 6 | Deferred |
| DATA-02 | Phase 6 | Done |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-26*
*Last updated: 2026-10-27 — 26 of 27 v1 requirements delivered; DATA-01 (CSV import) deferred*
