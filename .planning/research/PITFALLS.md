# Pitfalls Research — Drishti

Derived from `deep-research-report.md` (Barriers & Adoption Risks, lines 113–125) plus hackathon-specific failure modes.

## Domain Pitfalls

| # | Pitfall | Severity | Mitigation |
|---|---|---|---|
| 1 | **No real data** — every claim is on synthetic data | Critical | Say so on screen. Data Quality page states "Synthetic, OSRTC-scale, seeded". Judges reward honesty over fake live feeds |
| 2 | **Detection claimed, not measured** | Critical | Inject labeled anomalies; compute precision/recall in-app against ground truth |
| 3 | **Black-box distrust** | High | Every alert carries evidence rows + rule trace + method note for forecasts |
| 4 | **"Real-time" overclaim** | High | Show per-source sync age; label batch sources as batch |
| 5 | **Weak rural connectivity** | Medium | Batch-first design; no live stream anywhere in the demo path |
| 6 | **Existing ITMS overlap objection** | Medium | Frame as augmentation layer, not replacement; "reads what ITMS already captures" |
| 7 | **PII exposure** | Medium | Aggregate at trip level; no passenger names/phones in schema at all |
| 8 | **Odia/Indian formatting wrong** | Low | ₹ + lakh/crore formatter, IST, realistic route names |

## Engineering Pitfalls

| # | Pitfall | Mitigation |
|---|---|---|
| 9 | Demo non-determinism (random seed drift) | Fixed seed constant; `SEED_VERSION`; seed is a pure function of seed+version |
| 10 | SQLite file committed to git | `.gitignore` it; regenerate via `npm run seed` |
| 11 | Slow first load from 135k-row scans | Precompute aggregates into summary tables at seed time; index trip FK columns |
| 12 | Charts unreadable on projector | Min 14px axis labels, high-contrast palette, no 8-series stacked charts |
| 13 | Timezone bugs in date grouping | Store dates as `YYYY-MM-DD` strings + naive IST minutes; never `Date` arithmetic across TZ |
| 14 | Hydration mismatch from dates/currency | Format on server; pass strings to client components |
| 15 | Analytics logic buried in components | Pure functions in `src/core/`, tested with Vitest |
| 16 | `better-sqlite3` native build failure | Node 22 + prebuilt binaries; fallback documented in README |
| 17 | Scope creep into all four pillars deeply | Phase gates; Revenue Integrity is the only deep module |
| 18 | Fake data looks fake (round numbers) | Poisson demand + weekday/weekend seasonality + festival spikes + noise |

## Demo Pitfalls

| # | Pitfall | Mitigation |
|---|---|---|
| 19 | Presenter cannot answer "where does this number come from?" | Every KPI card has a provenance chip opening the evidence drawer |
| 20 | Empty/loading states look broken | Explicit skeletons and empty states designed, not default |
| 21 | No narrative | A 90-second demo script in README: problem → one alert → evidence → rupee impact → scorecard |
| 22 | Long setup on judging laptop | `npm i && npm run seed && npm run dev` only; no Docker, no keys |

## Anti-Pattern Warnings (from research)

- Do not claim ML where a rule suffices.
- Do not present a forecast without showing historical actuals beside it.
- Do not sort alerts by recency when the audience cares about money.
- Do not build a passenger-facing app; the PS is management-facing.
