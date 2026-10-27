import { describe, expect, it } from "vitest";
import { reconcileAggregate, reconcileTrip, TOLERANCE_INR, type ReconcileAggregate } from "./reconcile";
import type { TripFinancialInput } from "./types";

function base(overrides: Partial<ReconcileAggregate> = {}): ReconcileAggregate {
  return {
    tripId: "T000001",
    status: "completed",
    hasTickets: true,
    expected: 1000,
    collected: 1000,
    missingRemittance: 0,
    missingChannels: [],
    fareGap: 0,
    distanceKm: 120,
    capacity: 44,
    baseFarePerKm: 1.05,
    ...overrides,
  };
}

describe("reconcileAggregate", () => {
  it("returns null for a trip that reconciles inside tolerance", () => {
    expect(reconcileAggregate(base({ collected: 995 }))).toBeNull();
  });

  it("ignores rounding noise below the tolerance", () => {
    expect(reconcileAggregate(base({ collected: 1000 - TOLERANCE_INR + 0.01 }))).toBeNull();
  });

  it("classifies a missing remittance row as an ETM sync failure", () => {
    const result = reconcileAggregate(
      base({ missingRemittance: 620, missingChannels: ["etm"], collected: 380 }),
    );
    expect(result?.kind).toBe("ETM_SYNC_FAILURE");
    expect(result?.rupeesImpact).toBe(620);
    expect(result?.confidence).toBeGreaterThan(0.85);
    expect(result?.reasons.join(" ")).toMatch(/remittance/i);
  });

  it("classifies a cash shortfall as under-collection", () => {
    const result = reconcileAggregate(base({ collected: 700 }));
    expect(result?.kind).toBe("UNDER_COLLECTION");
    expect(result?.rupeesImpact).toBe(300);
    expect(result?.variance).toBe(300);
  });

  it("classifies excess remittance as a duplicate", () => {
    const result = reconcileAggregate(base({ collected: 1250 }));
    expect(result?.kind).toBe("DUPLICATE_SALE");
    expect(result?.rupeesImpact).toBe(250);
  });

  it("classifies an accounting gap as a fare mismatch", () => {
    const result = reconcileAggregate(base({ fareGap: 90 }));
    expect(result?.kind).toBe("FARE_MISMATCH");
    expect(result?.rupeesImpact).toBe(90);
  });

  it("flags a completed run with movement and no ticket record", () => {
    const result = reconcileAggregate(
      base({ hasTickets: false, expected: 0, collected: 0, distanceKm: 80 }),
    );
    expect(result?.kind).toBe("UNRECORDED_TRIP");
    expect(result?.rupeesImpact).toBeGreaterThan(1000);
  });

  it("does not flag a cancelled trip with no tickets", () => {
    expect(
      reconcileAggregate(
        base({ status: "cancelled", hasTickets: false, expected: 0, collected: 0, distanceKm: 0 }),
      ),
    ).toBeNull();
  });
});

describe("reconcileTrip (reference implementation)", () => {
  const trip: TripFinancialInput = {
    tripId: "T000042",
    serviceDate: "2026-10-01",
    routeId: "R001",
    routeCode: "BBS-PURI-M1",
    routeName: "Bhubaneswar → Puri",
    depotId: "BBS",
    status: "completed",
    departureTime: "08:00",
    distanceKm: 60,
    capacity: 44,
    baseFarePerKm: 1.05,
    tickets: [
      {
        channel: "etm",
        ticketsSold: 20,
        grossAmount: 600,
        discountAmount: 0,
        netAmount: 600,
      },
      {
        channel: "oprs",
        ticketsSold: 10,
        grossAmount: 300,
        discountAmount: 0,
        netAmount: 300,
      },
    ],
    collections: [
      { channel: "etm", cashAmount: 400, onlineAmount: 0, syncStatus: "synced" },
      { channel: "oprs", cashAmount: 0, onlineAmount: 300, syncStatus: "synced" },
    ],
  };

  it("agrees with the aggregate path", () => {
    const result = reconcileTrip(trip);
    expect(result?.kind).toBe("UNDER_COLLECTION");
    expect(result?.rupeesImpact).toBe(200);
  });

  it("treats a failed sync status as a missing remittance", () => {
    const result = reconcileTrip({
      ...trip,
      collections: [
        { channel: "etm", cashAmount: 0, onlineAmount: 0, syncStatus: "failed" },
        { channel: "oprs", cashAmount: 0, onlineAmount: 300, syncStatus: "synced" },
      ],
    });
    expect(result?.kind).toBe("ETM_SYNC_FAILURE");
    expect(result?.rupeesImpact).toBe(600);
  });
});
