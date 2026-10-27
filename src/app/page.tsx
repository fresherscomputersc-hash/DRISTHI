import Link from "next/link";
import { AlertTriangle, ArrowRight, BusFront, IndianRupee, TrendingUp } from "lucide-react";
import { RevenueTrend } from "@/components/charts/revenue-trend";
import { AlertTable } from "@/components/shared/alert-table";
import { FreshnessStrip } from "@/components/shared/freshness";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { REVENUE_KIND_LABEL } from "@/core/types";
import { cn, dayOfWeek, fmtDate, inr, num, pct } from "@/lib/utils";
import { getDemandBoard } from "@/server/queries/demand";
import { getDepotPerformance, getOverview } from "@/server/queries/overview";
import { freshness, getRevenueSummary } from "@/server/queries/revenue";

export const metadata = { title: "Command Center" };

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const PERSONA_INTRO: Record<string, string> = {
  exec:
    "One read across fleet, revenue, demand and maintenance — ranked by money at stake, with evidence one click away.",
  finance:
    "Revenue exposure first: every rupee of leakage, its cause, and the case that closes it.",
  ops: "Demand and deployment first: where seats are short, where they are empty, and what to change.",
  maint:
    "Fleet health first: availability, service overruns, and the vehicles most likely to fail next.",
};

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; persona?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? 30);
  const days = WINDOWS.some((w) => w.days === requested) ? requested : 30;

  const [overview, depots, summary, demand] = await Promise.all([
    Promise.resolve(getOverview(days)),
    Promise.resolve(getDepotPerformance(days)),
    Promise.resolve(getRevenueSummary(days)),
    Promise.resolve(getDemandBoard()),
  ]);
  const fresh = freshness();

  const availability = overview.fleet.total > 0 ? overview.fleet.active / overview.fleet.total : 0;
  const riskPct = overview.revenue > 0 ? (overview.revenueAtRisk / overview.revenue) * 100 : 0;
  const demandDelta = overview.demandDeltaPct;
  const maxKind = Math.max(1, ...summary.byKind.map((k) => k.impact));

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        eyebrow="OSRTC · Operations intelligence"
        title="Command Center"
        description={PERSONA_INTRO[params.persona ?? "exec"] ?? PERSONA_INTRO.exec}
        actions={
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            {WINDOWS.map((w) => (
              <Link
                key={w.days}
                href={`/?days=${w.days}`}
                aria-current={w.days === days ? "true" : undefined}
                className={cn(
                  "rounded px-2.5 py-1 text-label transition-colors",
                  w.days === days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {w.label}
              </Link>
            ))}
          </div>
        }
      />

      <section aria-label="Key indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Revenue · ${days}d`}
          value={inr(overview.revenue)}
          hint={`${inr(overview.avgDailyRevenue)} average per day`}
          href={`/revenue?days=${days}`}
          badge={{ text: `${num(overview.trips)} trips`, tone: "neutral" }}
        />
        <KpiCard
          label="Revenue at risk"
          value={inr(overview.revenueAtRisk)}
          hint={`${riskPct.toFixed(2)}% of revenue detected as recoverable`}
          href={`/revenue?days=${days}`}
          accent
          badge={{ text: `${num(overview.alerts)} alerts`, tone: "danger" }}
          spark={summary.daily.map((d) => d.impact)}
          sparkColor="hsl(var(--danger))"
        />
        <KpiCard
          label="Fleet availability"
          value={pct(availability * 100, 1)}
          hint={`${num(overview.fleet.active)} of ${num(overview.fleet.total)} vehicles fit for service`}
          href="/fleet"
          badge={{ text: `${num(overview.fleet.outOfService)} out`, tone: "warning" }}
        />
        <KpiCard
          label="Load factor"
          value={pct(overview.loadFactor * 100, 1)}
          hint={`${num(overview.boardings)} boardings across ${num(overview.trips)} trips`}
          href="/demand"
          delta={{
            value: `${demandDelta >= 0 ? "+" : ""}${demandDelta.toFixed(1)}%`,
            direction: demandDelta > 0.5 ? "up" : demandDelta < -0.5 ? "down" : "flat",
            good: demandDelta >= 0,
            label: "boardings, 7d vs prior",
          }}
        />
      </section>

      {demand.totals.tomorrow ? (
        <Card className="mt-3">
          <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-2 py-2.5">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
              <span className="eyebrow">Demand outlook</span>
            </span>
            <span>
              <span className="text-body font-semibold tabular">
                {num(demand.totals.tomorrowBoardings)}
              </span>
              <span className="ml-1.5 text-label text-muted-foreground">
                boardings forecast for {dayOfWeek(demand.totals.tomorrow)}{" "}
                {fmtDate(demand.totals.tomorrow)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge tone={demand.totals.overCapacity > 0 ? "danger" : "success"}>
                {num(demand.totals.overCapacity)} routes short of seats
              </Badge>
              <Badge tone="warning">{num(demand.totals.underUtilised)} running light</Badge>
              <span className="text-label text-muted-foreground tabular">
                {inr(demand.totals.opportunityInr)}/day at stake
              </span>
            </span>
            <Link
              href="/demand"
              className="ml-auto inline-flex items-center gap-1 text-label font-medium text-accent hover:underline"
            >
              Deployment board <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </CardBody>
        </Card>
      ) : null}

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
                Alerts ranked by rupee impact
              </CardTitle>
              <p className="mt-0.5 text-label text-muted-foreground">
                Not by recency — the largest exposure first. Every row opens its evidence.
              </p>
            </div>
            <Link
              href={`/revenue?days=${days}`}
              className="inline-flex items-center gap-1 text-label font-medium text-accent hover:underline"
            >
              All alerts <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </CardHeader>
          <CardBody className="px-0 pb-0">
            {overview.topAlerts.length === 0 ? (
              <EmptyState
                title="No leakage detected"
                description="Every trip in this window reconciled within the ₹25 tolerance."
                className="m-4"
              />
            ) : (
              <AlertTable rows={overview.topAlerts} />
            )}
          </CardBody>
          {overview.topAlerts.length > 0 ? (
            <CardFooter className="border-t-0">
              <span className="text-label text-muted-foreground">
                {num(overview.openCases)} cases still open across all modules
              </span>
              <span className="text-label font-medium tabular">
                {inr(overview.revenueAtRisk)} at risk
              </span>
            </CardFooter>
          ) : null}
        </Card>

        <div className="grid content-start gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BusFront className="h-4 w-4 text-accent" aria-hidden />
                Fleet at a glance
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-metric font-bold tabular">{num(overview.fleet.active)}</span>
                <span className="text-label text-muted-foreground">
                  active of {num(overview.fleet.total)}
                </span>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="bg-success"
                  style={{ width: `${(overview.fleet.active / Math.max(1, overview.fleet.total)) * 100}%` }}
                />
                <span
                  className="bg-warning"
                  style={{
                    width: `${(overview.fleet.maintenance / Math.max(1, overview.fleet.total)) * 100}%`,
                  }}
                />
                <span
                  className="bg-muted-foreground/40"
                  style={{ width: `${(overview.fleet.idle / Math.max(1, overview.fleet.total)) * 100}%` }}
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-label">
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Active
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular">{num(overview.fleet.active)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden /> Workshop
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular">{num(overview.fleet.maintenance)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden /> Idle
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular">{num(overview.fleet.idle)}</dd>
                </div>
              </dl>
              <Link
                href="/fleet"
                className="mt-3 inline-flex items-center gap-1 text-label font-medium text-accent hover:underline"
              >
                Maintenance risk board <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data freshness</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <FreshnessStrip data={fresh} />
              <p className="mt-3 border-t border-border/70 pt-2 text-micro leading-4 text-muted-foreground">
                Source ages are measured, not implied. Ticketing arrives in batches, telemetry every
                ten minutes — the console never claims more recency than it has.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-accent" aria-hidden />
                Leakage detected per day
              </CardTitle>
              <p className="mt-0.5 text-label text-muted-foreground">
                Each point is the rupee value of trips flagged that day, after reconciliation.
              </p>
            </div>
            <Badge tone="neutral">{days}-day window</Badge>
          </CardHeader>
          <CardBody className="pt-0">
            <RevenueTrend data={summary.daily} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
                By cause
              </CardTitle>
              <p className="mt-0.5 text-label text-muted-foreground">
                Classification, not a generic “mismatch”.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5 pt-0">
            {summary.byKind.map((row) => (
              <Link
                key={row.kind}
                href={`/revenue?days=${days}&kind=${row.kind}`}
                className="block rounded px-1 py-0.5 transition-colors hover:bg-muted/60"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-label font-medium">{REVENUE_KIND_LABEL[row.kind]}</span>
                  <span className="tabular text-label font-semibold">{inr(row.impact)}</span>
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${(row.impact / maxKind) * 100}%` }}
                    />
                  </span>
                  <span className="w-14 text-right text-micro text-muted-foreground tabular">
                    {num(row.count)} cases
                  </span>
                </span>
              </Link>
            ))}
            {summary.byKind.length === 0 ? (
              <p className="py-6 text-center text-label text-muted-foreground">
                No leakage in this window.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHeader>
          <div>
            <CardTitle>Depot performance</CardTitle>
            <p className="mt-0.5 text-label text-muted-foreground">
              Revenue, occupancy and exposure by originating depot.
            </p>
          </div>
          <Badge tone="neutral">{num(depots.length)} depots</Badge>
        </CardHeader>
        <CardBody className="px-0 pb-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col">Depot</th>
                  <th scope="col" className="text-right">Trips</th>
                  <th scope="col" className="text-right">Boardings</th>
                  <th scope="col" className="text-right">Load factor</th>
                  <th scope="col" className="text-right">Revenue</th>
                  <th scope="col" className="text-right">At risk</th>
                </tr>
              </thead>
              <tbody>
                {depots.map((d) => (
                  <tr key={d.depotId}>
                    <td className="font-medium">{d.depotName}</td>
                    <td className="text-right tabular text-muted-foreground">{num(d.trips)}</td>
                    <td className="text-right tabular">{num(d.boardings)}</td>
                    <td className="text-right tabular">
                      <span
                        className={cn(
                          "font-medium",
                          d.loadFactor >= 0.7
                            ? "text-success"
                            : d.loadFactor < 0.45
                              ? "text-warning"
                              : "",
                        )}
                      >
                        {pct(d.loadFactor * 100, 1)}
                      </span>
                    </td>
                    <td className="text-right tabular">{inr(d.revenue)}</td>
                    <td className="text-right tabular font-medium text-danger">
                      {d.atRisk > 0 ? inr(d.atRisk) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter>
          <span className="text-micro text-muted-foreground">
            Synthetic data at OSRTC-plausible scale · window {days} days
          </span>
          <Link href="/data-quality" className="text-label text-accent hover:underline">
            Data provenance
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
