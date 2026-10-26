# Requirements: Drishti — OSRTC Operations Intelligence

**Defined:** 2026-10-26
**Core Value:** Every alert is explainable and actionable — evidence rows, rule trace, and rupee impact behind every number.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: App runs offline from a single command with no API keys or external services
- [ ] **FOUND-02**: Seeded dataset is deterministic, versioned, and OSRTC-plausible (1,999 vehicles, ~180 routes, 90 days, ~135k trips)
- [ ] **FOUND-03**: Seed injects ~240 labeled anomalies with rupee impact for ground-truth scoring
- [ ] **FOUND-04**: User can switch between four personas (Executive, Operations, Maintenance, Finance) without authentication
- [ ] **FOUND-05**: Trip is the atomic data unit; every module reads the same trip model

### Command Center

- [ ] **CMD-01**: User sees fleet availability, revenue at risk, demand outlook, and open alerts on one screen
- [ ] **CMD-02**: Every KPI card opens the module and filter state that produced it
- [ ] **CMD-03**: Alert feed is ranked by rupee impact, not recency
- [ ] **CMD-04**: Per-source data freshness is visible with sync age

### Revenue Integrity

- [ ] **REV-01**: Finance user can see trip-level reconciliation of ticket sales vs cash + online collections
- [ ] **REV-02**: Each mismatch is classified as sync failure, under-collection, duplicate sale, fare mismatch, or unrecorded trip
- [ ] **REV-03**: Each mismatch has a confidence score and reason codes
- [ ] **REV-04**: Finance user can open an evidence panel showing contributing rows and the rule that fired
- [ ] **REV-05**: Finance user can acknowledge, assign, and resolve a case with a note
- [ ] **REV-06**: User sees total recoverable ₹ and detection precision/recall against ground truth

### Demand Intelligence

- [ ] **DEM-01**: Operations user can see boardings forecast by route, day, and hour for the next 7 days
- [ ] **DEM-02**: Every forecast shows a confidence band and backtested MAPE
- [ ] **DEM-03**: System flags capacity gaps where forecast load factor >100% or <40%
- [ ] **DEM-04**: System recommends adding or trimming trips with expected daily rupee impact

### Fleet & Maintenance

- [ ] **FLT-01**: User can see utilization per vehicle and route (load factor, dead-km ratio, idle time)
- [ ] **FLT-02**: Maintenance user can see a 0–100 breakdown-risk score per vehicle with top contributing factors
- [ ] **FLT-03**: Service-due queue is prioritized by risk and km since last service
- [ ] **FLT-04**: System suggests redeployments (move vehicle between routes/depots) grounded in forecast gaps

### Explainability & Data

- [ ] **EXP-01**: Every alert, KPI, and forecast exposes source rows on demand
- [ ] **EXP-02**: Every model output states its method, inputs, and confidence
- [ ] **DATA-01**: Analyst can import CSV extracts for trips, tickets, and maintenance with validation errors surfaced
- [ ] **DATA-02**: Data quality report shows missing telemetry, unlinked tickets, stale syncs, and orphan records

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
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| CMD-01 | Phase 3 | Pending |
| CMD-02 | Phase 3 | Pending |
| CMD-03 | Phase 3 | Pending |
| CMD-04 | Phase 3 | Pending |
| REV-01 | Phase 4 | Pending |
| REV-02 | Phase 4 | Pending |
| REV-03 | Phase 4 | Pending |
| REV-04 | Phase 4 | Pending |
| REV-05 | Phase 4 | Pending |
| REV-06 | Phase 4 | Pending |
| DEM-01 | Phase 5 | Pending |
| DEM-02 | Phase 5 | Pending |
| DEM-03 | Phase 5 | Pending |
| DEM-04 | Phase 5 | Pending |
| FLT-01 | Phase 5 | Pending |
| FLT-02 | Phase 5 | Pending |
| FLT-03 | Phase 5 | Pending |
| FLT-04 | Phase 5 | Pending |
| EXP-01 | Phase 2 | Pending |
| EXP-02 | Phase 2 | Pending |
| DATA-01 | Phase 6 | Pending |
| DATA-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-26*
*Last updated: 2026-10-26 after initial definition*
