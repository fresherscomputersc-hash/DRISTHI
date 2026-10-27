import Link from "next/link";
import { Database, FlaskConical, ShieldCheck } from "lucide-react";
import { FreshnessStrip } from "@/components/shared/freshness";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreDetections } from "@/core/scorecard";
import { fmtDate, inr, num, pct } from "@/lib/utils";
import { getQualityReport } from "@/server/queries/quality";
import { getScorecardForWindow } from "@/server/queries/revenue";

export const metadata = { title: "Data Quality" };

const TONE = {
  ok: "success",
  info: "info",
  warning: "warning",
  critical: "danger",
} as const;

const ASSUMPTIONS = [
  "1,999 vehicles — 577 mainline and 1,422 rural, matching published OSRTC fleet counts.",
  "192 routes across 12 depots, with Indian route and depot naming and realistic stage distances.",
  "90 days of history (28 Jul – 25 Oct 2026), about 1,370 scheduled trips per day.",
  "Ticketing split across ETM, OPRS and counter channels; remittances arrive in batches, not instantly.",
  "2,070 labelled anomalies injected — 2,040 revenue anomalies on trips, 15 capacity shortfalls and 15 vehicle-level maintenance risks.",
  "Rupee values in INR; timestamps in IST. All figures are deterministic from seed 20261026.",
];

export default async function DataQualityPage() {
  const report = getQualityReport();
  const { detections, truth } = getScorecardForWindow(90);
  const card = scoreDetections(
    detections.map((d) => ({ entityId: d.tripId, kind: d.kind, rupeesImpact: d.rupeesImpact })),
    truth,
  );

  const failing = report.checks.filter((c) => c.severity === "critical" || c.severity === "warning");

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        eyebrow="Trust & provenance"
        title="Data Quality"
        description="What the console knows, where it came from, how stale it is, and what it will not claim. The same evidence layer that backs every alert is audited here."
        actions={
          <Badge tone={failing.length === 0 ? "success" : "warning"}>
            {failing.length === 0 ? "All checks within band" : `${failing.length} checks need review`}
          </Badge>
        }
      />

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-warning" aria-hidden />
                This is a synthetic dataset
              </CardTitle>
              <p className="mt-0.5 max-w-3xl text-label text-muted-foreground">
                {report.disclaimer} It is generated at OSRTC-plausible scale so that detection
                quality can be measured against labels rather than asserted.
              </p>
            </div>
            <Badge tone="warning">seed {report.seedVersion}</Badge>
          </CardHeader>
          <CardBody className="grid gap-4 pt-0 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-1.5">Provenance</p>
              <dl className="space-y-1.5 text-label">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Generated</dt>
                  <dd className="font-medium">{report.generatedAt.slice(0, 16).replace("T", " ")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Window</dt>
                  <dd className="font-medium">
                    {fmtDate(report.window.start)} → {fmtDate(report.window.end)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Seed</dt>
                  <dd className="font-mono text-label">20261026</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Rebuild</dt>
                  <dd className="font-mono text-label">npm run seed</dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="eyebrow mb-1.5">Source freshness</p>
              <FreshnessStrip data={report.freshness} />
            </div>
          </CardBody>
          <CardFooter>
            <span className="text-micro text-muted-foreground">
              A source older than a day is shown as stale — the console never implies more recency
              than it has.
            </span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
              Measured detection quality
            </CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="eyebrow">Precision</dt>
                <dd className="mt-0.5 text-title font-bold tabular">{pct(card.precision, 1)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Recall</dt>
                <dd className="mt-0.5 text-title font-bold tabular">{pct(card.recall, 1)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Rupees detected</dt>
                <dd className="mt-0.5 text-base font-bold tabular">{inr(card.detectedRupees)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Rupee recall</dt>
                <dd className="mt-0.5 text-base font-bold tabular">{pct(card.rupeeRecall, 1)}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-border/70 pt-2 text-micro leading-4 text-muted-foreground">
              {num(card.truthCount)} injected anomalies, {num(card.detectedCount)} detections,{" "}
              {num(card.falsePositives)} false positives on a ₹25 tolerance. Count recall is exact
              because the rules encode the same failure mechanisms the generator injects; rupee
              recall is lower because an unrecorded trip is estimated from fare and distance, not
              read from a ticket that never existed.
            </p>
          </CardBody>
          <CardFooter>
            <Link href="/revenue#scorecard" className="text-label text-accent hover:underline">
              See the full scorecard
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" aria-hidden />
                Integrity checks
              </CardTitle>
              <p className="mt-0.5 text-label text-muted-foreground">
                Run against the seeded database on every request. Non-zero counts are explained, not
                hidden.
              </p>
            </div>
            <Badge tone="neutral">{num(report.checks.length)} checks</Badge>
          </CardHeader>
          <CardBody className="px-0 pb-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th scope="col">Check</th>
                    <th scope="col" className="text-right">Rows</th>
                    <th scope="col">Status</th>
                    <th scope="col">Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  {report.checks.map((check) => (
                    <tr key={check.id}>
                      <td className="font-medium">{check.label}</td>
                      <td className="text-right tabular">{num(check.count)}</td>
                      <td>
                        <Badge tone={TONE[check.severity]}>{check.severity}</Badge>
                      </td>
                      <td className="max-w-[420px] text-label text-muted-foreground">
                        {check.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
          <CardFooter>
            <span className="text-micro text-muted-foreground">
              Window {fmtDate(report.window.start)} → {fmtDate(report.window.end)}
            </span>
          </CardFooter>
        </Card>

        <div className="grid content-start gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Dataset at a glance</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-label">
                {[
                  ["Vehicles", report.totals.vehicles],
                  ["Routes", report.totals.routes],
                  ["Trips", report.totals.trips],
                  ["Ticket rows", report.totals.tickets],
                  ["Remittances", report.totals.collections],
                  ["Telemetry", report.totals.telemetry],
                  ["Maintenance", report.totals.maintenance],
                  ["Anomalies", report.totals.anomalies],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular">{num(Number(value))}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assumptions</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <ul className="space-y-1.5">
                {ASSUMPTIONS.map((item) => (
                  <li key={item} className="flex gap-1.5 text-label text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
            <CardFooter>
              <span className="text-micro text-muted-foreground">
                Documented in .planning/PROJECT.md
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
