# Features Research — Drishti

**Source:** PS #182 verbatim text + `deep-research-report.md`.

## The PS's Four Verbs → Feature Families

| PS verb | Feature family | v1 depth |
|---|---|---|
| predict demand | Demand Intelligence | Medium — forecast + capacity gaps |
| optimize fleet deployment | Fleet Deployment | Medium — utilization + redeployment suggestions |
| prevent breakdowns | Maintenance Intelligence | Medium — risk score + service queue |
| plug revenue leakage | Revenue Integrity | **Deep** — the provable workflow |

## Table Stakes (judges expect these without being told)

- Unified dashboard with fleet size, revenue, load factor, availability
- Route-level drill-down
- Charts that are readable at projector distance
- Filter by depot / date range / route
- Alert list with severity
- Currency in ₹ with lakh/crore formatting
- IST timestamps
- Data freshness indicator

## Differentiators (what wins)

1. **Evidence panels** — click any alert, see the rows that produced it and the rule that fired.
2. **Anomaly classification** — not "mismatch" but *why*: ETM sync failure vs under-collection vs duplicate sale vs fare mismatch.
3. **Ground-truth scorecard** — "240 anomalies injected, 87% detected, 4% false positives" is verifiable in-app.
4. **Rupee impact ranking** — alerts sorted by money at stake, not by timestamp.
5. **Case workflow** — acknowledge → assign → resolve, so the alert has a lifecycle.
6. **Honest data freshness** — shows sync age per source instead of a fake "LIVE" badge.
7. **Recommendation with reasoning** — "Add 1 trip on Route 12 at 08:00; forecast 118% of capacity; expected +₹4,200/day".

## Anti-Features (explicitly do not build)

| Anti-feature | Why |
|---|---|
| Fake live GPS map with random movement | Judges from OSRTC will spot it instantly; destroys credibility |
| "AI-powered" black-box predictions | Research line 257: do not over-promise AI |
| Per-passenger PII display | Government data-handling sensitivity |
| Full auth/RBAC in v1 | Not scored; burns phase budget |
| Microservices / Kafka / data lake | Absurd at demo scale; signals poor judgment |
| Model training at runtime | Non-deterministic demos fail under pressure |

## Feature → Screen Map

| Screen | Purpose | Primary persona |
|---|---|---|
| Command Center | 10-second situational read | Executive leadership |
| Revenue Integrity | Detect, explain, resolve leakage | Financial controllers |
| Demand Intelligence | Forecast + capacity gaps | Operations planners |
| Fleet & Maintenance | Utilization, risk, service queue | Maintenance engineers |
| Data Quality | Provenance, freshness, import health | All / analyst |
| Evidence Drawer | Global provenance surface | All |
