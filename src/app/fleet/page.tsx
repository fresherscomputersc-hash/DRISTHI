import Link from "next/link";
import { ArrowRight, BusFront, Route, Wrench } from "lucide-react";
import { Drawer } from "@/components/shared/drawer";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, fmtDate, inr, num, pct } from "@/lib/utils";
import type { RiskResult } from "@/core/risk";
import { getRouteUtilization, getVehicleDetail, getVehicleRiskBoard } from "@/server/queries/fleet";

export const metadata = { title: "Fleet & Maintenance" };

const BANDS: { key: RiskResult["band"]; label: string; bar: string; tone: "danger" | "warning" | "info" | "success" }[] = [
  { key: "critical", label: "Critical", bar: "bg-danger", tone: "danger" },
  { key: "high", label: "High", bar: "bg-warning", tone: "warning" },
  { key: "moderate", label: "Moderate", bar: "bg-info", tone: "info" },
  { key: "low", label: "Low", bar: "bg-success", tone: "success" },
];

function bandTone(band: RiskResult["band"]) {
  return band === "critical" ? "danger" : band === "high" ? "warning" : band === "moderate" ? "info" : "success";
}

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const board = getVehicleRiskBoard(400);
  const utilisation = getRouteUtilization(30);
  const vehicleId = pick("vehicle");
  const detail = vehicleId ? getVehicleDetail(vehicleId) : null;

  const { summary } = board;
  const atRisk = summary.critical + summary.high;
  const utilisationTop = utilisation.slice(0, 16);
  const emptiest = [...utilisation].sort((a, b) => a.loadFactor - b.loadFactor).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        eyebrow="Workshop & deployment"
        title="Fleet & Maintenance"
        description="A weighted risk score per vehicle from service interval, breakdown history, age and fault severity — with the factors that produced it, and the workshop decision that follows."
        actions={<Badge tone="neutral">{num(summary.active)} vehicles in service</Badge>}
      />

      <section aria-label="Fleet indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Vehicles in service"
          value={num(summary.active)}
          hint={`${num(summary.serviceOverdue)} past their service interval`}
          href="/fleet#risk"
          badge={{ text: `${num(summary.serviceOverdue)} overdue`, tone: summary.serviceOverdue > 0 ? "warning" : "success" }}
        />
        <KpiCard
          label="Critical + high risk"
          value={num(atRisk)}
          hint={`${pct((atRisk / Math.max(1, summary.active)) * 100, 1)} of the rolling fleet`}
          href="/fleet#risk"
          accent
          badge={{ text: `${num(summary.critical)} critical`, tone: "danger" }}
        />
        <KpiCard
          label="Fleet risk score"
          value={String(summary.fleetAvgScore)}
          hint="Weighted average out of 100 · lower is healthier"
          href="/fleet#risk"
          badge={{ text: "method visible", tone: "neutral" }}
        />
        <KpiCard
          label="Routes monitored"
          value={num(utilisation.length)}
          hint="Load factor and dead-km from the last 30 days"
          href="#utilisation"
          badge={{ text: `${num(utilisation.reduce((s, r) => s + r.trips, 0))} trips`, tone: "neutral" }}
        />
      </section>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card id="risk" className="scroll-mt-20 xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-accent" aria-hidden />
                Maintenance risk board
              </CardTitle>
              <p className="mt-0.5 text-label text-muted-foreground">
                Highest risk first. Every score decomposes into the five factors on the right.
              </p>
            </div>
            <Badge tone="neutral">top {num(board.rows.length)}</Badge>
          </CardHeader>
          <CardBody className="px-0 pb-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="data-table min-w-[860px]">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Depot</th>
                    <th scope="col">Risk</th>
                    <th scope="col">Main driver</th>
                    <th scope="col" className="text-right">Since service</th>
                    <th scope="col">Last event</th>
                    <th scope="col" className="w-8">
                      <span className="sr-only">Open vehicle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {board.rows.slice(0, 40).map((row) => {
                    const driver = [...row.factors].sort((a, b) => b.points - a.points)[0];
                    return (
                      <tr key={row.vehicleId} data-active={vehicleId === row.vehicleId ? "true" : "false"}>
                        <td>
                          <span className="block font-medium">{row.registration}</span>
                          <span className="block text-micro text-muted-foreground">{row.model}</span>
                        </td>
                        <td className="text-label text-muted-foreground">{row.depotName}</td>
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted" aria-hidden>
                              <span
                                className={cn(
                                  "block h-full",
                                  row.band === "critical"
                                    ? "bg-danger"
                                    : row.band === "high"
                                      ? "bg-warning"
                                      : row.band === "moderate"
                                        ? "bg-info"
                                        : "bg-success",
                                )}
                                style={{ width: `${row.score}%` }}
                              />
                            </span>
                            <span className="tabular text-label font-semibold">{row.score}</span>
                            <Badge tone={bandTone(row.band)}>{row.band}</Badge>
                          </span>
                        </td>
                        <td className="max-w-[220px]">
                          <span className="block truncate text-label" title={driver?.detail}>
                            {driver?.label ?? "—"}
                          </span>
                          <span className="block text-micro text-muted-foreground tabular">
                            +{driver?.points ?? 0} pts
                          </span>
                        </td>
                        <td className="text-right tabular">
                          <span
                            className={cn(
                              "font-medium",
                              row.kmSinceService > row.serviceIntervalKm && "text-danger",
                            )}
                          >
                            {num(row.kmSinceService)}
                          </span>
                          <span className="block text-micro text-muted-foreground">
                            of {num(row.serviceIntervalKm)} km
                          </span>
                        </td>
                        <td className="text-label text-muted-foreground">
                          {row.lastEventDate ? fmtDate(row.lastEventDate) : "—"}
                        </td>
                        <td>
                          <Link
                            href={`/fleet?vehicle=${row.vehicleId}`}
                            aria-label={`Open ${row.registration}`}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
          <CardFooter>
            <span className="text-micro text-muted-foreground">
              Score = service interval 30 + breakdowns 25 + age 20 + repeat repairs 15 + fault grade 10
            </span>
            <span className="text-label font-medium tabular">{num(atRisk)} need attention</span>
          </CardFooter>
        </Card>

        <div className="grid content-start gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BusFront className="h-4 w-4 text-accent" aria-hidden />
                Risk distribution
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-0">
              {BANDS.map((band) => {
                const count = summary[band.key];
                const share = (count / Math.max(1, summary.active)) * 100;
                return (
                  <div key={band.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-label">{band.label}</span>
                      <span className="text-label text-muted-foreground tabular">
                        {num(count)} · {pct(share, 1)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className={cn("h-full rounded-full", band.bar)} style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="border-t border-border/70 pt-2 text-micro leading-4 text-muted-foreground">
                Bands: ≥70 critical, 50–69 high, 30–49 moderate, below 30 low. A vehicle moves band
                only when the factors do — no opaque model.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4 text-accent" aria-hidden />
                Where seats are empty
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <ul className="space-y-2">
                {emptiest.map((row) => (
                  <li key={row.routeId} className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-label" title={row.name}>
                      {row.name}
                    </span>
                    <span className="shrink-0 text-label font-semibold tabular text-warning">
                      {pct(row.loadFactor * 100, 0)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="#utilisation"
                className="mt-3 inline-flex items-center gap-1 text-label font-medium text-accent hover:underline"
              >
                Full utilisation table <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card id="utilisation" className="mt-3 scroll-mt-20">
        <CardHeader>
          <div>
            <CardTitle>Route utilisation</CardTitle>
            <p className="mt-0.5 text-label text-muted-foreground">
              Seats offered versus seats filled, and the kilometres run outside the schedule — the
              two numbers that decide whether a deployment is earning.
            </p>
          </div>
          <Badge tone="neutral">last 30 days</Badge>
        </CardHeader>
        <CardBody className="px-0 pb-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Depot</th>
                  <th scope="col" className="text-right">Trips</th>
                  <th scope="col" className="text-right">Boardings</th>
                  <th scope="col" className="text-right">Load factor</th>
                  <th scope="col" className="text-right">Dead km</th>
                  <th scope="col" className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {utilisationTop.map((row) => (
                  <tr key={row.routeId}>
                    <td>
                      <span className="block max-w-[230px] truncate font-medium" title={row.name}>
                        {row.name}
                      </span>
                      <span className="block text-micro text-muted-foreground">{row.code}</span>
                    </td>
                    <td className="text-label text-muted-foreground">{row.depotName}</td>
                    <td className="text-right tabular text-muted-foreground">{num(row.trips)}</td>
                    <td className="text-right tabular">{num(row.boardings)}</td>
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
                        {pct(row.loadFactor * 100, 1)}
                      </span>
                    </td>
                    <td className="text-right tabular text-muted-foreground">
                      {pct(row.deadKmRatio * 100, 1)}
                    </td>
                    <td className="text-right tabular">{inr(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter>
          <span className="text-micro text-muted-foreground">
            Dead km = actual minus scheduled · top 16 routes by boardings
          </span>
          <Link href="/demand" className="text-label text-accent hover:underline">
            Demand forecast
          </Link>
        </CardFooter>
      </Card>

      {detail ? (
        <Drawer
          closeHref="/fleet"
          title={`${detail.vehicle.registration} · risk ${detail.risk.score}`}
          subtitle={`${detail.vehicle.model} · ${detail.vehicle.depotName} · ${detail.vehicle.capacity} seats`}
        >
          <div className="space-y-5">
            <section>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={bandTone(detail.risk.band)}>{detail.risk.band} risk</Badge>
                <Badge tone="neutral">{detail.vehicle.status}</Badge>
                <Badge tone="outline">
                  {detail.vehicle.ageYears.toFixed(1)} yrs · {num(detail.vehicle.odometerKm)} km
                </Badge>
              </div>
              <p className="mt-2 text-body">{detail.risk.recommendation}</p>
              <p className="mt-1 text-micro text-muted-foreground">{detail.risk.method}</p>
            </section>

            <section>
              <h3 className="mb-2 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Score decomposition
              </h3>
              <ul className="space-y-2">
                {detail.risk.factors.map((factor) => {
                  const weight = Math.max(1, factor.points);
                  return (
                    <li key={factor.label}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-label font-medium">{factor.label}</span>
                        <span className="text-label tabular text-muted-foreground">
                          +{factor.points} pts
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, weight * 4)}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-micro leading-4 text-muted-foreground">
                        {factor.detail}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Last 30 days on the road
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-label sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Trips</dt>
                  <dd className="font-semibold tabular">{num(detail.last30.trips)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Boardings</dt>
                  <dd className="font-semibold tabular">{num(detail.last30.boardings)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Load</dt>
                  <dd className="font-semibold tabular">{pct(detail.last30.loadFactor * 100, 1)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Revenue</dt>
                  <dd className="font-semibold tabular">{inr(detail.last30.revenue)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Maintenance history
              </h3>
              {detail.events.length === 0 ? (
                <p className="text-label text-muted-foreground">No workshop events recorded.</p>
              ) : (
                <div className="overflow-x-auto scrollbar-thin rounded border border-border">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Event</th>
                        <th scope="col" className="text-right">Odometer</th>
                        <th scope="col" className="text-right">Downtime</th>
                        <th scope="col" className="text-right">Cost</th>
                        <th scope="col">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.events.map((event) => (
                        <tr key={event.id}>
                          <td className="whitespace-nowrap">{fmtDate(event.eventDate)}</td>
                          <td>
                            <span className="block capitalize">{event.eventType}</span>
                            <span className="block text-micro text-muted-foreground">
                              {event.faultCode ?? event.notes ?? "—"}
                            </span>
                          </td>
                          <td className="text-right tabular">{num(event.odometerKm)}</td>
                          <td className="text-right tabular">{event.downtimeDays}d</td>
                          <td className="text-right tabular">{inr(event.costInr)}</td>
                          <td>
                            <Badge
                              tone={
                                event.severity === "critical"
                                  ? "danger"
                                  : event.severity === "high"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {event.severity}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}
