<!-- GSD:project-start source:PROJECT.md -->

## Project

**Drishti — OSRTC Operations Intelligence**

Drishti is a real-time operations-intelligence console for the Odisha State Road Transport Corporation (OSRTC), built for the OSFIC 2026 problem catalogue (PS #182, Commerce & Transport Department). It joins OSRTC's siloed operational, ticketing, and telematics data into a single trip-level truth, and converts that into four forward-looking decisions: predict passenger demand, optimize fleet deployment, prevent mechanical breakdowns, and plug revenue leakage. Its users are OSRTC's executive leadership, operations planners, maintenance engineers, and financial controllers.

**Core Value:** **Every alert is explainable and actionable** — each insight shows the underlying rows, the rule or model that fired, and the specific rupee or vehicle impact. If the evidence panel fails, the product has failed, regardless of how good the charts look.

### Constraints

- **Timeline**: Hackathon-scale (~30 days). Six phases, each independently demonstrable.
- **Data**: Synthetic, generated at OSRTC-plausible scale, with documented assumptions and injected ground-truth anomalies so detection quality can be measured rather than asserted.
- **Tech stack**: Next.js 15 (App Router) + TypeScript; Tailwind + shadcn/ui; SQLite via better-sqlite3 + Drizzle; Recharts; Vitest + Playwright.
- **Runtime**: Must run with `npm run dev` on a laptop with no network, no API keys, no external services.
- **Explainability**: No number in the UI may be unexplainable to a judge in one drill-down.
- **Locale**: INR (₹, lakh/crore formatting), IST timestamps, Indian route/depot naming.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
