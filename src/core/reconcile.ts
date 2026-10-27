import type { Channel, Detection, TripFinancialInput } from "./types";

/**
 * Detection tolerance, in rupees. Real remittances carry sub-rupee rounding
 * noise, so anything inside this band is not evidence of leakage.
 */
export const TOLERANCE_INR = 25;

/** A fare row is internally consistent when gross − discount = net. */
const FARE_TOLERANCE_INR = 1;

const CHANNEL_LABEL: Record<Channel, string> = {
  etm: "on-board ETM",
  oprs: "OPRS online",
  counter: "depot counter",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Aggregated facts about one trip. The SQL layer produces these directly, so
 * reconciliation never needs to load 270k ticket rows into memory.
 */
export type ReconcileAggregate = {
  tripId: string;
  status: "completed" | "cancelled" | "partial";
  hasTickets: boolean;
  /** Sum of ticket net amounts. */
  expected: number;
  /** Sum of cash + online remittances. */
  collected: number;
  /** Ticket value whose channel has no remittance row at all. */
  missingRemittance: number;
  missingChannels: Channel[];
  /** Sum of (gross − discount − net) where positive. */
  fareGap: number;
  distanceKm: number;
  capacity: number;
  baseFarePerKm: number;
};

function estimateUnrecorded(a: ReconcileAggregate): number {
  const fare = Math.max(15, a.distanceKm * a.baseFarePerKm);
  return round2(fare * a.capacity * 0.55);
}

export function reconcileAggregate(a: ReconcileAggregate): Detection | null {
  const expected = round2(a.expected);
  const collected = round2(a.collected);
  const variance = round2(expected - collected);
  const reasons: string[] = [];

  /* 1. A completed run with movement but no ticket record at all. */
  if (a.status !== "cancelled" && !a.hasTickets && a.distanceKm > 5) {
    const estimate = estimateUnrecorded(a);
    return {
      tripId: a.tripId,
      kind: "UNRECORDED_TRIP",
      expected: estimate,
      collected: 0,
      variance: estimate,
      rupeesImpact: estimate,
      confidence: 0.74,
      reasons: [
        "Telemetry records a completed run with distance on the odometer",
        "No ticket or collection row exists for this trip",
        `Expected revenue estimated from ${a.distanceKm.toFixed(0)} km × ${a.capacity} seats at 55% load`,
      ],
      channel: "all",
    };
  }

  if (!a.hasTickets) return null;

  /* 2. Ticket value exists for a channel, but no remittance row arrived. */
  if (a.missingRemittance > 0) {
    const labels = a.missingChannels.map((c) => CHANNEL_LABEL[c]).join(" and ");
    reasons.push(`${labels}: tickets worth ₹${a.missingRemittance.toFixed(0)} were issued`);
    reasons.push("No remittance row was received for this channel");
    return {
      tripId: a.tripId,
      kind: "ETM_SYNC_FAILURE",
      expected,
      collected,
      variance,
      rupeesImpact: round2(a.missingRemittance),
      confidence: 0.9,
      reasons,
      channel: a.missingChannels.length === 1 ? a.missingChannels[0] : "all",
    };
  }

  /* 3. Internal fare integrity: gross minus discount must equal net. */
  if (a.fareGap > TOLERANCE_INR) {
    reasons.push("Net fare is lower than gross fare less concession");
    reasons.push(`Accounting gap of ₹${a.fareGap.toFixed(0)} on this trip's fare rows`);
    return {
      tripId: a.tripId,
      kind: "FARE_MISMATCH",
      expected,
      collected,
      variance,
      rupeesImpact: round2(a.fareGap),
      confidence: 0.92,
      reasons,
      channel: "all",
    };
  }

  /* 4. Cash short of ticket value. */
  if (variance > TOLERANCE_INR) {
    const share = expected > 0 ? variance / expected : 0;
    reasons.push(`Tickets issued: ₹${expected.toFixed(0)}`);
    reasons.push(`Cash + online remitted: ₹${collected.toFixed(0)}`);
    reasons.push(`${(share * 100).toFixed(1)}% of fare value is unaccounted`);
    return {
      tripId: a.tripId,
      kind: "UNDER_COLLECTION",
      expected,
      collected,
      variance,
      rupeesImpact: variance,
      confidence: Math.min(0.94, 0.78 + share),
      reasons,
      channel: "all",
    };
  }

  /* 5. Remittance exceeds ticket value — refund/duplicate risk. */
  if (variance < -TOLERANCE_INR) {
    reasons.push(`Remitted ₹${collected.toFixed(0)} against tickets worth ₹${expected.toFixed(0)}`);
    reasons.push("Excess may be a duplicate posting or a fare correction not applied to tickets");
    return {
      tripId: a.tripId,
      kind: "DUPLICATE_SALE",
      expected,
      collected,
      variance,
      rupeesImpact: Math.abs(variance),
      confidence: 0.72,
      reasons,
      channel: "all",
    };
  }

  return null;
}

/** Reference implementation used by the detail view and by unit tests. */
export function reconcileTrip(trip: TripFinancialInput): Detection | null {
  const expected = round2(trip.tickets.reduce((s, r) => s + r.netAmount, 0));
  const collected = round2(
    trip.collections.reduce((s, r) => s + r.cashAmount + r.onlineAmount, 0),
  );

  const missingChannels: Channel[] = [];
  let missingRemittance = 0;
  for (const row of trip.tickets) {
    if (row.netAmount <= 0) continue;
    const match = trip.collections.find((c) => c.channel === row.channel);
    if (!match || match.syncStatus === "failed") {
      missingChannels.push(row.channel);
      missingRemittance += row.netAmount;
    }
  }

  const fareGap = trip.tickets.reduce((sum, row) => {
    const gap = row.grossAmount - row.discountAmount - row.netAmount;
    return gap > FARE_TOLERANCE_INR ? sum + gap : sum;
  }, 0);

  return reconcileAggregate({
    tripId: trip.tripId,
    status: trip.status,
    hasTickets: trip.tickets.length > 0,
    expected,
    collected,
    missingRemittance,
    missingChannels,
    fareGap,
    distanceKm: trip.distanceKm,
    capacity: trip.capacity,
    baseFarePerKm: trip.baseFarePerKm,
  });
}

export function reconcileAll(trips: TripFinancialInput[]): Detection[] {
  const out: Detection[] = [];
  for (const trip of trips) {
    const hit = reconcileTrip(trip);
    if (hit) out.push(hit);
  }
  return out.sort((a, b) => b.rupeesImpact - a.rupeesImpact);
}
