import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Confidence } from "@/components/shared/confidence";
import { KindBadge } from "@/components/shared/kind-badge";
import type { DetectedTrip } from "@/server/queries/revenue";
import { inr } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function AlertTable({
  rows,
  dense = false,
  showConfidence = true,
}: {
  rows: DetectedTrip[];
  dense?: boolean;
  showConfidence?: boolean;
}) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="data-table min-w-[640px]">
        <thead>
          <tr>
            <th scope="col">Alert</th>
            <th scope="col">Trip</th>
            <th scope="col">Route</th>
            <th scope="col">Depot</th>
            <th scope="col" className="text-right">
              Impact
            </th>
            {showConfidence ? <th scope="col">Confidence</th> : null}
            <th scope="col" className="w-8">
              <span className="sr-only">Open evidence</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.tripId}-${row.kind}`} className={cn(dense && "text-label")}>
              <td>
                <KindBadge kind={row.kind} />
              </td>
              <td>
                <Link
                  href={`/revenue?trip=${row.tripId}`}
                  className="font-mono text-label text-foreground underline-offset-2 hover:text-accent hover:underline"
                >
                  {row.tripId}
                </Link>
                <span className="block text-micro text-muted-foreground">{row.serviceDate}</span>
              </td>
              <td>
                <span className="block max-w-[190px] truncate text-label" title={row.routeName}>
                  {row.routeName}
                </span>
                <span className="block text-micro text-muted-foreground">{row.routeCode}</span>
              </td>
              <td className="text-label text-muted-foreground">{row.depotName}</td>
              <td className="text-right font-semibold tabular">{inr(row.rupeesImpact)}</td>
              {showConfidence ? (
                <td>
                  <Confidence value={row.confidence} />
                </td>
              ) : null}
              <td>
                <Link
                  href={`/revenue?trip=${row.tripId}`}
                  aria-label={`Open evidence for trip ${row.tripId}`}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
