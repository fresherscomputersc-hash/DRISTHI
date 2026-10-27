import Link from "next/link";
import { ArrowRight, Filter, ShieldCheck } from "lucide-react";
import { AlertTable } from "@/components/shared/alert-table";
import { Confidence } from "@/components/shared/confidence";
import { Drawer } from "@/components/shared/drawer";
import { KindBadge } from "@/components/shared/kind-badge";
import { PageHeader } from "@/components/shared/page-header";
import { CaseForm } from "@/components/revenue/case-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { scoreDetections } from "@/core/scorecard";
import { REVENUE_KIND_LABEL, type CaseStatus, type RevenueKind } from "@/core/types";
import { fmtDate, fmtTime, inr, inrExact, num, pct } from "@/lib/utils";
import {
  caseKey,
  filterDetections,
  getCaseMap,
  getDepotOptions,
  getDetections,
  getScorecardForWindow,
  getTripEvidence,
} from "@/server/queries/revenue";

export const metadata = { title: "Revenue Integrity" };

const WINDOWS = [7, 30, 90];
const KINDS = Object.keys(REVENUE_KIND_LABEL) as RevenueKind[];

function buildHref(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === "all" || value === 0) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `/revenue?${qs}` : "/revenue";
}

function statusTone(status: CaseStatus): "danger" | "warning" | "info" | "success" {
  return status === "resolved"
    ? "success"
    : status === "assigned"
      ? "info"
      : status === "acknowledged"
        ? "warning"
        : "danger";
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const requested = Number(pick("days") ?? 30);
  const days = WINDOWS.includes(requested) ? requested : 30;
  const depot = pick("depot") ?? "all";
  const kind = (pick("kind") ?? "all") as RevenueKind | "all";
  const query = pick("q") ?? "";
  const minImpact = Number(pick("min") ?? 0) || 0;
  const tripParam = pick("trip");

  const all = getDetections({ days });
  const filtered = filterDetections(all, { depotId: depot, kind, query, minImpact });
  const caseMap = getCaseMap();
  const depots = getDepotOptions();

  const { detections: window90, truth } = getScorecardForWindow(90);
  const card = scoreDetections(
    window90.map((d) => ({ entityId: d.tripId, kind: d.kind, rupeesImpact: d.rupeesImpact })),
    truth,
  );

  const evidence = tripParam ? getTripEvidence(tripParam) : null;
  const closeHref = buildHref({ days, depot, kind, q: query, min: minImpact });

  const totalImpact = filtered.reduce((s, d) => s + d.rupeesImpact, 0);
  const openCases = filtered.filter((d) => {
    const c = caseMap.get(caseKey(d.tripId, d.kind));
    return !c || c.status !== "resolved";
  }).length;
  const avgConfidence =
    filtered.length > 0 ? filtered.reduce((s, d) => s + d.confidence, 0) / filtered.length : 0;
  const visible = filtered.slice(0, 150);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        eyebrow="Financial control"
        title="Revenue Integrity"
        description="Trip-level reconciliation of what was ticketed against what was remitted — classified by cause, ranked by rupees, and closed through a case workflow."
        actions={
          <Link
            href="#scorecard"
            className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 text-label font-medium hover:bg-muted/60"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            Detection quality {pct(card.recall, 1)} recall
          </Link>
        }
      />

      <Card className="mb-3">
        <CardBody className="pt-3">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="eyebrow">Window</span>
              <select
                name="days"
                defaultValue={String(days)}
                className="mt-1 h-8 rounded border border-input bg-card px-2 text-body"
              >
                {WINDOWS.map((d) => (
                  <option key={d} value={d}>
                    Last {d} days
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Depot</span>
              <select
                name="depot"
                defaultValue={depot}
                className="mt-1 h-8 rounded border border-input bg-card px-2 text-body"
              >
                <option value="all">All depots</option>
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Cause</span>
              <select
                name="kind"
                defaultValue={kind}
                className="mt-1 h-8 rounded border border-input bg-card px-2 text-body"
              >
                <option value="all">All causes</option>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {REVENUE_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-[180px] flex-1">
              <span className="eyebrow">Search</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Trip, route or vehicle"
                className="mt-1 h-8 w-full rounded border border-input bg-card px-2 text-body placeholder:text-muted-foreground/70"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-body font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Apply
            </button>
            {depot !== "all" || kind !== "all" || query ? (
              <Link
                href={buildHref({ days })}
                className="inline-flex h-8 items-center rounded px-2 text-label text-muted-foreground hover:bg-muted"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </CardBody>
      </Card>

      <section aria-label="Revenue summary" className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="eyebrow">Recoverable in view</p>
          <p className="mt-2 text-metric font-bold leading-none tabular text-danger">
            {inr(totalImpact)}
          </p>
          <p className="mt-2 text-label text-muted-foreground">
            {num(filtered.length)} classified alerts · {num(openCases)} not yet resolved
          </p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Cases resolved</p>
          <p className="mt-2 text-metric font-bold leading-none tabular">
            {num(filtered.length - openCases)}
            <span className="ml-2 text-label font-normal text-muted-foreground">
              of {num(filtered.length)}
            </span>
          </p>
          <p className="mt-2 text-label text-muted-foreground">
            {filtered.length > 0
              ? `${pct(((filtered.length - openCases) / filtered.length) * 100, 0)} closed with a recorded outcome`
              : "No cases in this view yet"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Average confidence</p>
          <p className="mt-2 text-metric font-bold leading-none tabular">
            {pct(avgConfidence * 100, 1)}
          </p>
          <p className="mt-2 text-label text-muted-foreground">
            Every alert carries its rule trace and source rows
          </p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Ground-truth score</p>
          <p className="mt-2 text-metric font-bold leading-none tabular">
            {pct(card.precision, 1)}
            <span className="ml-2 text-label font-normal text-muted-foreground">precision</span>
          </p>
          <p className="mt-2 text-label text-muted-foreground">
            {pct(card.recall, 1)} recall across {num(card.truthCount)} injected anomalies
          </p>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Alert ledger</CardTitle>
            <p className="mt-0.5 text-label text-muted-foreground">
              Ranked by rupee impact. Open a row to see the exact rows that produced it. The ledger
              shows the 150 largest; narrow the window or cause to see the rest.
            </p>
          </div>
          <Badge tone="neutral">
            {num(visible.length)} of {num(filtered.length)}
          </Badge>
        </CardHeader>
        <CardBody className="px-0 pb-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing matches these filters"
              description="Every trip in this slice reconciled within the ₹25 tolerance. Widen the window or clear the filters."
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="data-table min-w-[980px]">
                <thead>
                  <tr>
                    <th scope="col">Cause</th>
                    <th scope="col">Trip</th>
                    <th scope="col">Route</th>
                    <th scope="col" className="text-right">Expected</th>
                    <th scope="col" className="text-right">Remitted</th>
                    <th scope="col" className="text-right">Impact</th>
                    <th scope="col">Conf.</th>
                    <th scope="col">Case</th>
                    <th scope="col" className="w-8">
                      <span className="sr-only">Evidence</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const c = caseMap.get(caseKey(row.tripId, row.kind));
                    return (
                      <tr
                        key={`${row.tripId}-${row.kind}`}
                        data-active={tripParam === row.tripId ? "true" : "false"}
                      >
                        <td>
                          <KindBadge kind={row.kind} />
                        </td>
                        <td>
                          <Link
                            href={buildHref({
                              days,
                              depot,
                              kind,
                              q: query,
                              min: minImpact,
                              trip: row.tripId,
                            })}
                            className="font-mono text-label underline-offset-2 hover:text-accent hover:underline"
                          >
                            {row.tripId}
                          </Link>
                          <span className="block text-micro text-muted-foreground">
                            {fmtDate(row.serviceDate)} · {fmtTime(row.departureTime)}
                          </span>
                        </td>
                        <td>
                          <span className="block max-w-[220px] truncate" title={row.routeName}>
                            {row.routeName}
                          </span>
                          <span className="block text-micro text-muted-foreground">
                            {row.depotName} · {row.registration}
                          </span>
                        </td>
                        <td className="text-right tabular text-muted-foreground">
                          {inr(row.expected)}
                        </td>
                        <td className="text-right tabular text-muted-foreground">
                          {inr(row.collected)}
                        </td>
                        <td className="text-right font-semibold tabular text-danger">
                          {inr(row.rupeesImpact)}
                        </td>
                        <td>
                          <Confidence value={row.confidence} />
                        </td>
                        <td>
                          <Badge tone={statusTone(c?.status ?? "open")}>
                            {c?.status ?? "open"}
                          </Badge>
                        </td>
                        <td>
                          <Link
                            href={buildHref({
                              days,
                              depot,
                              kind,
                              q: query,
                              min: minImpact,
                              trip: row.tripId,
                            })}
                            aria-label={`Open evidence for ${row.tripId}`}
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
          )}
        </CardBody>
        <CardFooter>
          <span className="text-micro text-muted-foreground">
            Tolerance ₹25 per trip · natural remittance rounding sits below the line
          </span>
          <span className="text-label font-medium tabular">{inr(totalImpact)} in view</span>
        </CardFooter>
      </Card>

      <Card id="scorecard" className="mt-3 scroll-mt-20">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
              Detection quality against injected ground truth
            </CardTitle>
            <p className="mt-0.5 max-w-3xl text-label text-muted-foreground">
              The dataset contains labelled anomalies written by the generator. The scorecard
              matches detections to those labels on (trip, cause) — no fuzzy credit. Last 90 days.
            </p>
          </div>
          <Badge tone="success">{pct(card.f1, 1)} F1</Badge>
        </CardHeader>
        <CardBody className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Precision", value: pct(card.precision, 1) },
              { label: "Recall", value: pct(card.recall, 1) },
              { label: "Matched", value: `${num(card.matched)} / ${num(card.truthCount)}` },
              { label: "False positives", value: num(card.falsePositives) },
              { label: "Rupees detected", value: inr(card.detectedRupees) },
              { label: "Rupee recall", value: pct(card.rupeeRecall, 1) },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="eyebrow">{stat.label}</dt>
                <dd className="mt-0.5 text-base font-bold tabular">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[520px]">
              <thead>
                <tr>
                  <th scope="col">Cause</th>
                  <th scope="col" className="text-right">Injected</th>
                  <th scope="col" className="text-right">Detected</th>
                  <th scope="col" className="text-right">Matched</th>
                  <th scope="col" className="text-right">Recall</th>
                </tr>
              </thead>
              <tbody>
                {card.byKind.map((row) => (
                  <tr key={row.kind}>
                    <td>
                      <KindBadge kind={row.kind as RevenueKind} />
                    </td>
                    <td className="text-right tabular">{num(row.truthCount)}</td>
                    <td className="text-right tabular">{num(row.detectedCount)}</td>
                    <td className="text-right tabular">{num(row.matched)}</td>
                    <td className="text-right tabular font-medium">{pct(row.recall, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter>
          <span className="text-micro text-muted-foreground">
            Method: rules over the trip ledger with a ₹25 tolerance, then classification by
            dominant cause. Synthetic data; a pilot must recalibrate against OSRTC remittance lag.
          </span>
        </CardFooter>
      </Card>

      {evidence ? (
        <Drawer
          closeHref={closeHref}
          title={`${evidence.trip.id} · ${inr(evidence.detection?.rupeesImpact ?? 0)}`}
          subtitle={`${evidence.route.name} · ${fmtDate(evidence.trip.serviceDate)} ${fmtTime(
            evidence.trip.departureTime,
          )} · ${evidence.vehicle.registration}`}
        >
          <div className="space-y-5">
            {evidence.detection ? (
              <section>
                <div className="flex flex-wrap items-center gap-2">
                  <KindBadge kind={evidence.detection.kind} />
                  <Confidence value={evidence.detection.confidence} />
                  <Badge tone="outline">{evidence.detection.channel}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="eyebrow">Ticketed</dt>
                    <dd className="mt-0.5 text-base font-bold tabular">
                      {inrExact(evidence.detection.expected)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Remitted</dt>
                    <dd className="mt-0.5 text-base font-bold tabular">
                      {inrExact(evidence.detection.collected)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Variance</dt>
                    <dd className="mt-0.5 text-base font-bold tabular text-danger">
                      {inrExact(evidence.detection.variance)}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Rule</dt>
                    <dd className="mt-0.5 text-label font-medium">
                      {REVENUE_KIND_LABEL[evidence.detection.kind]}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : (
              <p className="rounded border border-border bg-muted/40 px-3 py-2 text-label">
                This trip now reconciles within tolerance. It may have been re-checked after a
                corrected remittance.
              </p>
            )}

            {evidence.detection ? (
              <section>
                <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Why this fired
                </h3>
                <ol className="space-y-1.5">
                  {evidence.detection.reasons.map((reason, index) => (
                    <li key={reason} className="flex gap-2 text-body">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {evidence.groundTruth ? (
              <section className="rounded border border-success/25 bg-success-subtle px-3 py-2">
                <p className="text-label font-semibold text-success">
                  Injected ground truth: {evidence.groundTruth.kind.replaceAll("_", " ")} ·{" "}
                  {inrExact(evidence.groundTruth.rupeesImpact)}
                </p>
                <p className="mt-0.5 text-label text-success/90">{evidence.groundTruth.note}</p>
              </section>
            ) : (
              <section className="rounded border border-border bg-muted/40 px-3 py-2">
                <p className="text-label text-muted-foreground">
                  No ground-truth label on this trip — it is a natural variance, not an injected
                  anomaly.
                </p>
              </section>
            )}

            <section>
              <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Tickets issued
              </h3>
              <div className="overflow-x-auto scrollbar-thin rounded border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Channel</th>
                      <th scope="col" className="text-right">Pax</th>
                      <th scope="col" className="text-right">Gross</th>
                      <th scope="col" className="text-right">Concession</th>
                      <th scope="col" className="text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.tickets.map((t) => (
                      <tr key={t.channel}>
                        <td className="uppercase">{t.channel}</td>
                        <td className="text-right tabular">{num(t.ticketsSold)}</td>
                        <td className="text-right tabular">{inrExact(t.grossAmount)}</td>
                        <td className="text-right tabular text-muted-foreground">
                          {t.discountAmount > 0 ? inrExact(-t.discountAmount) : "—"}
                        </td>
                        <td className="text-right font-medium tabular">{inrExact(t.netAmount)}</td>
                      </tr>
                    ))}
                    {evidence.tickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted-foreground">
                          No ticket rows exist for this trip.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Remittances received
              </h3>
              <div className="overflow-x-auto scrollbar-thin rounded border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Channel</th>
                      <th scope="col" className="text-right">Cash</th>
                      <th scope="col" className="text-right">Online</th>
                      <th scope="col">Remitted</th>
                      <th scope="col">Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.collections.map((c) => (
                      <tr key={c.channel}>
                        <td className="uppercase">{c.channel}</td>
                        <td className="text-right tabular">{inrExact(c.cashAmount)}</td>
                        <td className="text-right tabular">{inrExact(c.onlineAmount)}</td>
                        <td className="text-label text-muted-foreground">
                          {c.remittedOn ?? "—"}
                        </td>
                        <td>
                          <Badge tone={c.syncStatus === "synced" ? "success" : "warning"}>
                            {c.syncStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {evidence.tickets
                      .filter((t) => !evidence.collections.some((c) => c.channel === t.channel))
                      .map((t) => (
                        <tr key={`missing-${t.channel}`} className="bg-danger-subtle/60">
                          <td className="uppercase">{t.channel}</td>
                          <td className="text-right text-danger">—</td>
                          <td className="text-right text-danger">—</td>
                          <td className="text-danger" colSpan={2}>
                            No remittance row received for this channel
                          </td>
                        </tr>
                      ))}
                    {evidence.collections.length === 0 && evidence.tickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted-foreground">
                          No remittance rows exist for this trip.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {evidence.telemetry ? (
              <section>
                <h3 className="mb-1.5 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Telemetry
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-label sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Distance</dt>
                    <dd className="font-medium tabular">
                      {evidence.telemetry.distanceKm.toFixed(1)} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Avg speed</dt>
                    <dd className="font-medium tabular">
                      {evidence.telemetry.avgSpeedKmph.toFixed(1)} km/h
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">GPS points</dt>
                    <dd className="font-medium tabular">{num(evidence.telemetry.gpsPoints)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Idle</dt>
                    <dd className="font-medium tabular">{evidence.telemetry.idleMinutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Largest gap</dt>
                    <dd className="font-medium tabular">{evidence.telemetry.gpsGapMinutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last ping</dt>
                    <dd className="font-medium">{evidence.telemetry.lastPing.slice(0, 16)}</dd>
                  </div>
                </dl>
              </section>
            ) : null}

            <section className="rounded border border-border bg-muted/20 p-3">
              <h3 className="mb-2 text-label font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Case workflow
              </h3>
              {evidence.detection ? (
                <CaseForm
                  tripId={evidence.trip.id}
                  kind={evidence.detection.kind}
                  rupeesImpact={evidence.detection.rupeesImpact}
                  current={
                    evidence.caseRow
                      ? {
                          status: evidence.caseRow.status,
                          assignee: evidence.caseRow.assignee,
                          note: evidence.caseRow.note,
                        }
                      : null
                  }
                />
              ) : (
                <p className="text-label text-muted-foreground">
                  No open discrepancy — nothing to action.
                </p>
              )}
            </section>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}
