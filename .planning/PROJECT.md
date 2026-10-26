# Drishti — OSRTC Operations Intelligence

## What This Is

Drishti is a real-time operations-intelligence console for the Odisha State Road Transport Corporation (OSRTC), built for the OSFIC 2026 problem catalogue (PS #182, Commerce & Transport Department). It joins OSRTC's siloed operational, ticketing, and telematics data into a single trip-level truth, and converts that into four forward-looking decisions: predict passenger demand, optimize fleet deployment, prevent mechanical breakdowns, and plug revenue leakage. Its users are OSRTC's executive leadership, operations planners, maintenance engineers, and financial controllers.

## Core Value

**Every alert is explainable and actionable** — each insight shows the underlying rows, the rule or model that fired, and the specific rupee or vehicle impact. If the evidence panel fails, the product has failed, regardless of how good the charts look.

## Business Context

- **Customer**: OSRTC / Department of Commerce & Transport, Government of Odisha (via OSFIC 2026 challenge)
- **Revenue model**: Not commercialized in v1 — hackathon demonstration, architected for a later AMC / per-vehicle pilot with OSRTC and other State Transport Undertakings
- **Success metric**: Demonstrated detection of injected operational anomalies (revenue leakage, capacity shortfall, maintenance risk) with a stated precision/recall, tied to a rupee value at risk
- **Strategy notes**: `deep-research-report.md` (source research) and `problem statement.txt` (verbatim PS text)

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Users can see a unified command center across fleet, revenue, demand, and maintenance
- [ ] Finance controllers can detect and classify trip-level revenue leakage with evidence
- [ ] Operations planners can forecast demand by route/day/hour and see capacity gaps
- [ ] Operations planners can receive fleet redeployment recommendations grounded in forecast
- [ ] Maintenance engineers can see breakdown-risk scores and service-due queues per vehicle
- [ ] Every alert exposes provenance: source rows, rule/model trace, confidence, rupee impact
- [ ] Data freshness is visible and honest (batch/ETM sync age, not a fake "live" badge)
- [ ] The app runs fully offline on a laptop with deterministic seeded data

### Out of Scope

- Live GPS streaming and real-time ingestion from ITMS/OPRS — no API access exists; batch/CSV is the honest v1
- Authentication, SSO, and audit trail — demo-quality v1 with pilot-shaped seams (`— deferred to v2`)
- Mobile app — responsive web only
- OR-Tools / optimization solver — rule-based and heuristic recommendations are explainable and sufficient
- Deep learning models — the PS asks for decisions, not sophistication; explainability wins adoption
- Hindi/Odia full localization — English UI with Odia accents in branding only

## Context

**Problem source (verbatim, PS #182):** "The Odisha State Road Transport Corporation (OSRTC) generates massive volumes of operational, ticketing, and telematics data that remain underutilized in silos. Without intelligent synthesis, management lacks real-time visibility to predict passenger demand, optimize fleet deployment, prevent mechanical breakdowns, and plug revenue leakage, leading to operational inefficiencies."

**Research base** (`deep-research-report.md`, Oct 2026):
- No real OSRTC data is available to us. Data availability is the single largest risk (evidence Grade D).
- OSRTC scale: ~577 mainline + ~1,422 rural buses; 130+ cities; revenue ₹156.43 cr (FY23-24); cumulative loss ₹45.46 cr over FY22-24; 109 buses rendered inoperable by mechanical failure.
- 1% revenue leakage ≈ ₹1.56 cr/year — enough to justify the tool several times over.
- Existing systems (ITMS, OPRS, ETM) cover tracking and ticketing but not cross-source analytics.
- Rural connectivity is weak → batch/offline tolerance is mandatory, not a nice-to-have.

**Product stance:** breadth of PS coverage in the UI, depth in one workflow (Revenue Integrity). Judges score against the four listed capabilities; trust is earned through explainability.

## Constraints

- **Timeline**: Hackathon-scale (~30 days). Six phases, each independently demonstrable.
- **Data**: Synthetic, generated at OSRTC-plausible scale, with documented assumptions and injected ground-truth anomalies so detection quality can be measured rather than asserted.
- **Tech stack**: Next.js 15 (App Router) + TypeScript; Tailwind + shadcn/ui; SQLite via better-sqlite3 + Drizzle; Recharts; Vitest + Playwright.
- **Runtime**: Must run with `npm run dev` on a laptop with no network, no API keys, no external services.
- **Explainability**: No number in the UI may be unexplainable to a judge in one drill-down.
- **Locale**: INR (₹, lakh/crore formatting), IST timestamps, Indian route/depot naming.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build all four PS pillars, go deep on Revenue Integrity | PS lists four; judges score against the text; trust needs one provable workflow | — Pending |
| SQLite + seeded generator instead of a live pipeline | No OSRTC data access; demo must run offline and deterministically | — Pending |
| TypeScript analytics (Holt-Winters, rules, risk scoring) instead of Python/Prophet service | One runtime, deterministic, testable, explainable; no second process to babysit | — Pending |
| Explainability as core value, not a feature | Research: adoption fails on black boxes; every alert carries evidence | — Pending |
| Synthetic data with injected ground truth | Enables measured precision/recall instead of unverifiable claims | — Pending |
| Trip as the atomic data unit | The only grain that joins ticketing, telematics, maintenance, and revenue | — Pending |
| `AGENTS.md` as the instruction file | opencode runtime target | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-26 after initialization*
