import { clamp } from "@/lib/utils";

export type RiskInput = {
  vehicleId: string;
  ageYears: number;
  odometerKm: number;
  lastServiceKm: number;
  serviceIntervalKm: number;
  breakdowns90d: number;
  repairs90d: number;
  lastFaultSeverity?: "low" | "medium" | "high" | "critical" | null;
  gpsGapAvgMinutes?: number;
};

export type RiskFactor = {
  label: string;
  points: number;
  detail: string;
};

export type RiskResult = {
  vehicleId: string;
  score: number;
  band: "low" | "moderate" | "high" | "critical";
  factors: RiskFactor[];
  method: string;
  recommendation: string;
  kmSinceService: number;
};

export const RISK_METHOD =
  "Weighted additive: service overrun (40) + vehicle age (20) + breakdowns (25) + repairs (15) + fault severity (15), clamped to 100";

export function riskScore(input: RiskInput): RiskResult {
  const kmSinceService = Math.max(0, input.odometerKm - input.lastServiceKm);
  const ratio = input.serviceIntervalKm > 0 ? kmSinceService / input.serviceIntervalKm : 0;

  const servicePoints = clamp((ratio - 0.6) * 66, 0, 40);
  const agePoints = clamp((input.ageYears / 12) * 20, 0, 20);
  const breakdownPoints = clamp(input.breakdowns90d * 9, 0, 25);
  const repairPoints = clamp(input.repairs90d * 3.5, 0, 15);
  const faultPoints =
    input.lastFaultSeverity === "critical"
      ? 15
      : input.lastFaultSeverity === "high"
        ? 10
        : input.lastFaultSeverity === "medium"
          ? 5
          : input.lastFaultSeverity === "low"
            ? 2
            : 0;

  const factors: RiskFactor[] = [
    {
      label: "Service interval",
      points: round1(servicePoints),
      detail: `${Math.round(kmSinceService).toLocaleString("en-IN")} km since last service — ${(ratio * 100).toFixed(0)}% of the ${input.serviceIntervalKm.toLocaleString("en-IN")} km interval`,
    },
    {
      label: "Breakdowns (90d)",
      points: round1(breakdownPoints),
      detail: `${input.breakdowns90d} breakdown event${input.breakdowns90d === 1 ? "" : "s"} in the window`,
    },
    {
      label: "Vehicle age",
      points: round1(agePoints),
      detail: `${input.ageYears.toFixed(1)} years, ${Math.round(input.odometerKm).toLocaleString("en-IN")} km on the odometer`,
    },
    {
      label: "Repeat repairs",
      points: round1(repairPoints),
      detail: `${input.repairs90d} repair${input.repairs90d === 1 ? "" : "s"} in the window`,
    },
    {
      label: "Latest fault severity",
      points: round1(faultPoints),
      detail: input.lastFaultSeverity ? `Most recent fault graded ${input.lastFaultSeverity}` : "No fault recorded",
    },
  ];

  const score = clamp(
    servicePoints + agePoints + breakdownPoints + repairPoints + faultPoints,
    0,
    100,
  );

  const band: RiskResult["band"] =
    score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "moderate" : "low";

  const recommendation =
    band === "critical"
      ? "Withdraw for inspection before the next scheduled departure."
      : band === "high"
        ? "Book workshop slot within 7 days; avoid long-distance allocation."
        : band === "moderate"
          ? "Schedule service at the next depot halt."
          : "No action needed this cycle.";

  return {
    vehicleId: input.vehicleId,
    score: Math.round(score),
    band,
    factors: factors.sort((a, b) => b.points - a.points),
    method: RISK_METHOD,
    recommendation,
    kmSinceService,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type UtilizationInput = {
  scheduledKm: number;
  actualKm: number;
  boardings: number;
  seats: number;
};

export type UtilizationResult = {
  loadFactor: number;
  deadKm: number;
  deadKmRatio: number;
  revenueEfficiency: "strong" | "healthy" | "weak";
};

export function utilization(input: UtilizationInput): UtilizationResult {
  const loadFactor = input.seats > 0 ? input.boardings / input.seats : 0;
  const deadKm = Math.max(0, input.actualKm - input.scheduledKm);
  const deadKmRatio = input.scheduledKm > 0 ? deadKm / input.scheduledKm : 0;
  const revenueEfficiency =
    loadFactor >= 0.7 ? "strong" : loadFactor >= 0.45 ? "healthy" : "weak";
  return {
    loadFactor,
    deadKm: Math.round(deadKm),
    deadKmRatio,
    revenueEfficiency,
  };
}
