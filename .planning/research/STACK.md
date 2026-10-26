# Stack Research — Drishti

**Source:** Derived from `deep-research-report.md` (Oct 2026) + OSFIC PS #182.
**Constraint that dominates every choice:** no real OSRTC data, no API access, demo must run offline on a laptop.

## Recommended Stack

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | One process for UI + server data access; server components keep SQLite off the client |
| Language | TypeScript (strict) | 5.x | Analytics correctness benefits from types; shared types across engine + UI |
| Styling | Tailwind CSS | 3.4 | Data-dense utility styling without hand-written CSS sprawl |
| Components | shadcn/ui (Radix primitives) | latest | Accessible dialogs/tables/tabs; copy-in, no runtime dependency lock-in |
| Charts | Recharts | 2.x | Composable SVG charts; good enough for forecast bands, sparklines, bars |
| DB | SQLite via better-sqlite3 | 11.x | Zero-install, single file, synchronous reads, perfect for demo determinism |
| ORM/Query | Drizzle ORM | 0.3x | Typed schema + SQL escape hatch; no binary engine to ship |
| Analytics | Pure TypeScript | — | Holt-Winters seasonal forecast, rule engine, weighted risk score |
| Tests | Vitest + Playwright | latest | Engine unit tests + critical UI flows |
| Icons | lucide-react | latest | Consistent with shadcn |

## Rejected Alternatives

| Option | Why rejected |
|---|---|
| Python + Prophet microservice | Second runtime, model training at demo time, non-deterministic, harder to explain line-by-line to a judge |
| Postgres + Docker | Demo room risk; no benefit at 135k-row scale |
| Streamlit | Fast but cannot deliver the enterprise console quality this PS's audience expects |
| Power BI / Tableau | Licensing, no custom alert workflow, no evidence panels |
| Prisma | Binary engine + migration ceremony for a read-mostly demo dataset |
| Serverless/cloud deploy | Network dependency during judging; local-first is the safer story |

## Data Scale (synthetic, OSRTC-plausible)

- **Fleet**: 1,999 vehicles (577 mainline + 1,422 rural) — matches published OSRTC counts
- **Network**: ~180 routes across 12 depots, 130+ destination names
- **Window**: 90 days of history + 7-day forecast horizon
- **Volume**: ~1,500 trips/day → ~135,000 trip records; ticket data aggregated per trip
- **Anomalies**: ~240 injected, labeled, with rupee impact
- **Size on disk**: target < 120 MB SQLite file, generated in < 60 s

## Runtime Requirements

- Node ≥ 20 (verified: v22.20.0)
- npm ≥ 10 (verified: 10.9.3)
- No network at runtime, no environment secrets, no external APIs
- `npm run dev` → app on localhost; `npm run seed` → deterministic rebuild
