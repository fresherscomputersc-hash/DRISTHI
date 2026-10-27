import Link from "next/link";
import { ArrowRight, CalendarClock, Gauge, TrendingUp, Users } from "lucide-react";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CapacityGap } from "@/core/forecast";
import { cn, dayOfWeek, fmtDate, inr, num, pct } from "@/lib/utils";
import { getDemandBoard, getDemandDetail, getRouteOptions } from "@/server/queries/demand";

export const metadata = { title: "Demand Intelligence" };

function expectedDaily(gap: CapacityGap | null, avgFare: number): number {
  if (!gap) return 0;
  if (gap.kind === "over_capacity") {
    return Math.round((gap.forecastBoardings - gap.seats) * avgFare);
  }
  return Math.round((gap.seats - gap.forecastBoardings) * avgFare * 0.25);
}

function severityTone(severity: "high" | "medium" | "low") {
  return severity === "high" ? "danger" : severity === "medium" ? "warning" : "info";
}

export default async function DemandPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const routes = getRouteOptions();
  const board = getDemandBoard();
  const routeId = pick("route") ?? board.rows[0]?.routeId ?? routes[0]?.id;
  const detail = routeId ? getDemandDetail(routeId) : null;

  const depots = Array.from(new Set(routes.map((r) => r.depotName))).sort();
  const tomorrow = detail?.forecast.points[0];
  const opportunity = detail ? expectedDaily(detail.gap, detail.avgFare) : 0;
  const loadFactor = detail?.gap?.loadFactor ?? null;

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        eyebrow="Network planning"
        title="Demand Intelligence"
        description="A seven-day boardings forecast per route, backtested against held-out history, then compared with the seats actually scheduled. The model refuses to forecast when the history is too thin."
        actions={
          <Badge tone={board.totals.refused > 0 ? "warning" : "success"}>
            {board.totals.refused > 0
              ? `${board.totals.refused} routes withheld`
              : "All routes forecastable"}
          </Badge>
        }
      />

      <Card className="mb-3">
        <CardBody className="pt-3">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="block min-w-[280px] flex-1">
              <span className="eyebrow">Route</span>
              <select
                name="route"
                defaultValue={routeId}
                className="mt-1 h-8 w-full max-w-lg rounded border border-input bg-card px-2 text-body"
              >
                {depots.map((depot) => (
                  <optgroup key={depot} label={depot}>
                    {routes
                      .filter((r) => r.depotName === depot)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} · {r.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-body font-medium text-primary-foreground hover:bg-primary/90"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              Forecast
            </button>
            <p className="ml-auto text-label text-muted-foreground">
              {num(board.totals.routes)} routes · {num(board.totals.overCapacity)} short of seats
            </p>
          </form>
        </CardBody>
      </Card>

      {detail ? (
        <>
          <section aria-label="Route indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Forecast · tomorrow"
              value={tomorrow ? num(tomorrow.value) : "—"}
              hint={
                tomorrow
                  ? `${fmtDate(tomorrow.date)} · range ${num(tomorrow.lower)}–${num(tomorrow.upper)}`
                  : "Forecast withheld for this route"
              }
              href={`/demand?route=${detail.route.id}`}
              accent
              badge={{
                text: tomorrow ? `${dayOfWeek(tomorrow.date)}` : "no forecast",
                tone: tomorrow ? "info" : "warning",
              }}
            />
            <KpiCard
              label="Backtest error"
              value={detail.forecast.mape === null ? "—" : pct(detail.forecast.mape, 1)}
              hint="MAPE on the last 14 days, held out of training"
              href={`/demand?route=${detail.route.id}`}
              badge={{
                text: detail.forecast.mape === null ? "unavailable" : "backtested",
                tone: detail.forecast.mape === null ? "neutral" : "success",
              }}
            />
            <KpiCard
              label="Seats scheduled"
              value={num(Math.round(detail.capacityPerTrip * detail.tripsPerDay))}
              hint={`${detail.tripsPerDay}/day × ${detail.capacityPerTrip} seats · load ${loadFactor === null ? "—" : pct(loadFactor * 100, 0)}`}
              href="/fleet"
              badge={{
                text: loadFactor === null ? "—" : loadFactor >= 1 ? "short" : loadFactor <= 0.4 ? "empty" : "balanced",
                tone:
                  loadFactor === null ? "neutral" : loadFactor >= 1 ? "danger" : loadFactor <= 0.4 ? "warning" : "success",
              }}
            />
            <KpiCard
              label="Daily opportunity"
              value={opportunity > 0 ? inr(opportunity) : "—"}
              hint={
                detail.gap
                  ? detail.gap.kind === "over_capacity"
                    ? "Fare value of passengers left behind each day"
                    : "Fare value recoverable by trimming empty trips"
                  : "No capacity mismatch on this route"
              }
              href="/demand"
              badge={{
                text: detail.gap ? detail.gap.severity : "matched",
                tone: detail.gap ? severityTone(detail.gap.severity) : "success",
              }}
            />
          </section>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" aria-hidden />
                    {detail.route.name}
                  </CardTitle>
                  <p className="mt-0.5 text-label text-muted-foreground">
                    {detail.route.code} · {detail.route.depotName} · {detail.route.routeType} ·{" "}
                    {detail.route.distanceKm} km
                  </p>
                </div>
                <Badge tone="neutral">90 days history · 7 day horizon</Badge>
              </CardHeader>
              <CardBody className="pt-0">
                {detail.forecast.meetsThreshold ? (
                  <>
                    <ForecastChart history={detail.forecast.history} points={detail.forecast.points} />
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                      {detail.forecast.points.map((point) => (
                        <div
                          key={point.date}
                          className="rounded border border-border/80 bg-muted/20 px-2 py-1.5"
                        >
                          <p className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
                            {dayOfWeek(point.date)} {fmtDate(point.date).slice(0, 6)}
                          </p>
                          <p className="mt-0.5 text-label font-bold tabular">{num(point.value)}</p>
                          <p className="text-micro text-muted-foreground tabular">
                            {num(point.lower)}–{num(point.upper)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-warning/40 bg-warning-subtle/40 px-6 py-12 text-center">
                    <CalendarClock className="h-5 w-5 text-warning" aria-hidden />
                    <p className="text-body font-semibold">Forecast withheld</p>
                    <p className="max-w-md text-label text-muted-foreground">
                      {detail.forecast.reason ??
                        "This route does not yet have enough reliable history to forecast."}{" "}
                      The console shows nothing rather than a number it cannot defend.
                    </p>
                  </div>
                )}
              </CardBody>
              <CardFooter>
                <span className="text-micro text-muted-foreground">{detail.forecast.method}</span>
                <span className="text-micro text-muted-foreground">
                  Weekly seasonal shape: {detail.forecast.seasonality.map((v) => Math.round(v)).join(" · ")}
                </span>
              </CardFooter>
            </Card>

            <div className="grid content-start gap-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-accent" aria-hidden />
                    Deployment recommendation
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-3 pt-0">
                  {detail.gap ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge tone={severityTone(detail.gap.severity)}>
                          {detail.gap.severity} severity
                        </Badge>
                        <Badge tone="neutral">
                          {detail.gap.kind === "over_capacity" ? "Demand > seats" : "Seats > demand"}
                        </Badge>
                      </div>
                      <p className="text-body font-medium">{detail.gap.suggestion}</p>
                      <dl className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3">
                        <div>
                          <dt className="eyebrow">Forecast boardings</dt>
                          <dd className="mt-0.5 text-base font-bold tabular">
                            {num(detail.gap.forecastBoardings)}
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow">Seats offered</dt>
                          <dd className="mt-0.5 text-base font-bold tabular">{num(detail.gap.seats)}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow">Load factor</dt>
                          <dd className="mt-0.5 text-base font-bold tabular">
                            {pct(detail.gap.loadFactor * 100, 0)}
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow">Daily value</dt>
                          <dd className="mt-0.5 text-base font-bold tabular text-accent">
                            {opportunity > 0 ? inr(opportunity) : "—"}
                          </dd>
                        </div>
                      </dl>
                      <p className="border-t border-border/70 pt-2 text-micro leading-4 text-muted-foreground">
                        Fires when forecast demand exceeds seats (add trips) or fills 40% or less
                        (trim / downsize). Between those bands, the schedule stays.
                      </p>
                    </>
                  ) : (
                    <p className="text-body text-muted-foreground">
                      Forecast demand sits inside the scheduled capacity band. No deployment change
                      is recommended for {fmtDate(tomorrow?.date ?? "")}.
                    </p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model card</CardTitle>
                </CardHeader>
                <CardBody className="space-y-2 pt-0 text-label">
                  <p className="text-muted-foreground">
                    Additive Holt-Winters with a weekly season, fitted on {num(detail.history.length)}{" "}
                    days of route boardings. Residual spread is carried into the shaded band; the
                    error figure is a real hold-out, not a training score.
                  </p>
                  <dl className="grid grid-cols-2 gap-2 border-t border-border/70 pt-2">
                    <div>
                      <dt className="eyebrow">Residual σ</dt>
                      <dd className="font-semibold tabular">{detail.forecast.residualSd.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Avg fare</dt>
                      <dd className="font-semibold tabular">{inr(detail.avgFare)}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Boardings · 30d</dt>
                      <dd className="font-semibold tabular">{num(detail.last30.boardings)}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Revenue · 30d</dt>
                      <dd className="font-semibold tabular">{inr(detail.last30.revenue)}</dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="p-6">
          <p className="text-body font-medium">Select a route to forecast.</p>
        </Card>
      )}

      <Card className="mt-3">
        <CardHeader>
          <div>
            <CardTitle>Network deployment board</CardTitle>
            <p className="mt-0.5 text-label text-muted-foreground">
              Every route ranked by capacity mismatch — where to add a trip, and where to stop
              paying for empty seats.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="danger">{num(board.totals.overCapacity)} short</Badge>
            <Badge tone="warning">{num(board.totals.underUtilised)} empty</Badge>
            <Badge tone="neutral">{inr(board.totals.opportunityInr)}/day</Badge>
          </div>
        </CardHeader>
        <CardBody className="px-0 pb-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Depot</th>
                  <th scope="col" className="text-right">Load</th>
                  <th scope="col" className="text-right">Forecast</th>
                  <th scope="col" className="text-right">Seats</th>
                  <th scope="col">Gap</th>
                  <th scope="col" className="text-right">₹/day</th>
                  <th scope="col" className="w-8">
                    <span className="sr-only">Open route</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.rows.slice(0, 40).map((row) => (
                  <tr key={row.routeId} data-active={row.routeId === routeId ? "true" : "false"}>
                    <td>
                      <span className="block max-w-[260px] truncate font-medium" title={row.name}>
                        {row.name}
                      </span>
                      <span className="block text-micro text-muted-foreground">{row.code}</span>
                    </td>
                    <td className="text-label text-muted-foreground">{row.depotName}</td>
                    <td className="text-right tabular">
                      <span
                        className={cn(
                          "font-medium",
                          row.loadFactor >= 0.7
                            ? "text-success"
                            : row.loadFactor <= 0.4
                              ? "text-warning"
                              : "",
                        )}
                      >
                        {pct(row.loadFactor * 100, 0)}
                      </span>
                    </td>
                    <td className="text-right tabular">{num(row.forecast)}</td>
                    <td className="text-right tabular text-muted-foreground">{num(row.seats)}</td>
                    <td>
                      {row.gap ? (
                        <Badge tone={row.gap.kind === "over_capacity" ? "danger" : "warning"}>
                          {row.gap.kind === "over_capacity" ? "add trips" : "trim"}
                        </Badge>
                      ) : (
                        <span className="text-label text-muted-foreground">balanced</span>
                      )}
                    </td>
                    <td className="text-right tabular font-medium">
                      {row.expectedDailyInr > 0 ? inr(row.expectedDailyInr) : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/demand?route=${row.routeId}`}
                        aria-label={`Forecast ${row.name}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter>
          <span className="text-micro text-muted-foreground">
            Showing the 40 largest mismatches of {num(board.rows.length)} forecastable routes ·{" "}
            {num(board.totals.refused)} withheld for thin history
          </span>
          <Link href="/revenue" className="text-label text-accent hover:underline">
            Revenue impact
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
