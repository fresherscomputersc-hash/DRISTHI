# Project Research Summary — Drishti

**Problem:** OSFIC 2026 PS #182 — OSRTC operations data sits in silos; management cannot predict demand, optimize deployment, prevent breakdowns, or plug revenue leakage.

## Key Findings

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts, SQLite via better-sqlite3 + Drizzle, analytics in pure TypeScript, Vitest + Playwright. One process, offline, deterministic.

**Data reality:** No OSRTC data access (Grade D evidence). The product must be honest about this: synthetic data at OSRTC-plausible scale (1,999 vehicles, ~180 routes, 90 days, ~135k trips) with ~240 labeled injected anomalies so detection quality is *measured*, not asserted.

**The differentiator:** Explainable, actionable alerts. Research line 191: "the single most important capability is an Explainable Alert + Recommendation." Breadth across all four PS verbs; depth in Revenue Integrity, the only pillar provable from ticketing data alone.

**The money story:** ₹156.43 cr revenue (FY23-24), ₹45.46 cr cumulative loss (FY22-24), 109 buses inoperable, 1% leakage ≈ ₹1.56 cr/year.

**Watch out for:** fake live GPS, black-box claims, overclaiming "real-time", PII in the dataset, and scope creep into four deep modules.

## Table Stakes

Unified dashboard, route/depot drill-down, ₹ lakh-crore formatting, IST, filterable alert list, data-freshness indicator, projector-readable charts.

## Differentiators

Evidence panels · anomaly classification (sync failure vs under-collection vs duplicate vs fare mismatch) · ground-truth scorecard · rupee-impact ranking · case workflow · honest freshness · recommendations with reasoning.

## Implications for Roadmap

1. **Foundation first, and non-negotiable** — the trip-level model plus seeded generator is the enabling asset for all four pillars. Nothing else can be built before it.
2. **Analytics core next, tested before UI** — reconciliation, classification, forecasting, risk scoring are pure functions with Vitest coverage. Building UI on untested analytics is how demos break.
3. **Command Center third** — it consumes every module; it is the integration test.
4. **Revenue Integrity fourth, deepest** — the demo's centrepiece; needs Case workflow, evidence drawer, recoverable-₹ rollup.
5. **Demand + Fleet fifth** — the remaining two PS verbs, using the same alert/evidence primitives.
6. **Hardening last** — CSV import, data quality, a11y, Playwright, demo script.

**Sequencing rule:** no phase may depend on a later phase. Each ends in something demonstrable, because the judging date may move.

## Success Signal

A judge asks "is this real?" and the answer is: *"No — it's synthetic, and here is the ground-truth scorecard showing we detected 87% of injected leakage at 4% false positives, worth ₹X."* That answer is stronger than any claim of live data.
