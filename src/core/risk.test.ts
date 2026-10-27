import { describe, expect, it } from "vitest";
import { riskScore, utilization } from "./risk";
import { scoreDetections } from "./scorecard";

const healthy = {
  vehicleId: "V0001",
  ageYears: 1.2,
  odometerKm: 90_000,
  lastServiceKm: 82_000,
  serviceIntervalKm: 20_000,
  breakdowns90d: 0,
  repairs90d: 0,
  lastFaultSeverity: null,
};

describe("riskScore", () => {
  it("keeps a young, recently serviced vehicle in the low band", () => {
    const result = riskScore(healthy);
    expect(result.score).toBeLessThan(25);
    expect(result.band).toBe("low");
  });

  it("raises the score when service is overdue and breakdowns repeat", () => {
    const result = riskScore({
      ...healthy,
      ageYears: 9.5,
      odometerKm: 900_000,
      lastServiceKm: 850_000,
      breakdowns90d: 3,
      repairs90d: 2,
      lastFaultSeverity: "critical",
    });
    expect(result.score).toBeGreaterThan(70);
    expect(result.band).toBe("critical");
    expect(result.factors[0].points).toBeGreaterThan(0);
  });

  it("never exceeds 100", () => {
    const result = riskScore({
      ...healthy,
      ageYears: 40,
      odometerKm: 5_000_000,
      lastServiceKm: 0,
      breakdowns90d: 20,
      repairs90d: 20,
      lastFaultSeverity: "critical",
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("explains itself with factors and a recommendation", () => {
    const result = riskScore(healthy);
    expect(result.factors.length).toBeGreaterThanOrEqual(4);
    expect(result.method).toMatch(/Weighted/i);
    expect(result.recommendation.length).toBeGreaterThan(10);
  });
});

describe("utilization", () => {
  it("computes load factor and dead-km", () => {
    const result = utilization({ scheduledKm: 1000, actualKm: 1100, boardings: 300, seats: 440 });
    expect(result.loadFactor).toBeCloseTo(0.682, 2);
    expect(result.deadKm).toBe(100);
    expect(result.deadKmRatio).toBeCloseTo(0.1, 3);
    expect(result.revenueEfficiency).toBe("healthy");
  });
});

describe("scoreDetections", () => {
  const truth = [
    { entityId: "T1", kind: "ETM_SYNC_FAILURE", rupeesImpact: 500 },
    { entityId: "T2", kind: "UNDER_COLLECTION", rupeesImpact: 300 },
    { entityId: "T3", kind: "FARE_MISMATCH", rupeesImpact: 100 },
    { entityId: "T4", kind: "UNRECORDED_TRIP", rupeesImpact: 900 },
  ];

  it("matches only on entity and kind", () => {
    const detections = [
      { entityId: "T1", kind: "ETM_SYNC_FAILURE", rupeesImpact: 500 },
      { entityId: "T2", kind: "FARE_MISMATCH", rupeesImpact: 300 }, // wrong kind
      { entityId: "T9", kind: "UNDER_COLLECTION", rupeesImpact: 80 }, // false positive
    ];
    const card = scoreDetections(detections, truth);
    expect(card.matched).toBe(1);
    expect(card.falsePositives).toBe(2);
    expect(card.missed).toBe(3);
    expect(card.precision).toBeCloseTo(33.3, 1);
    expect(card.recall).toBe(25);
  });

  it("reports rupee recall separately from count recall", () => {
    const card = scoreDetections([{ entityId: "T4", kind: "UNRECORDED_TRIP", rupeesImpact: 900 }], truth);
    expect(card.recall).toBe(25);
    expect(card.rupeeRecall).toBe(50);
  });

  it("handles the empty case without dividing by zero", () => {
    const card = scoreDetections([], []);
    expect(card.precision).toBe(0);
    expect(card.recall).toBe(0);
    expect(Number.isNaN(card.f1)).toBe(false);
  });
});
