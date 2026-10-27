import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/utils";
import { capacityGap, forecastDemand, holtWinters, type SeriesPoint } from "./forecast";

function series(values: number[], start = "2026-07-01"): SeriesPoint[] {
  return values.map((value, i) => ({ date: addDays(start, i), value }));
}

/** Weekly seasonal pattern plus mild growth and deterministic wobble. */
function synthetic(days = 90): number[] {
  return Array.from({ length: days }, (_, i) => {
    const weekly = [0, 60, 40, 35, 45, 80, 70][i % 7];
    const growth = i * 0.35;
    const wobble = (i % 5) - 2;
    return Math.round(120 + weekly + growth + wobble);
  });
}

describe("holtWinters", () => {
  it("recovers the weekly shape from a seasonal series", () => {
    const values = synthetic(90);
    const fit = holtWinters(values, 7);
    expect(fit.forecast).toHaveLength(7);
    // Saturday/Sunday should sit above Tuesday/Wednesday.
    const hi = Math.max(fit.forecast[0], fit.forecast[1]);
    const lo = Math.min(fit.forecast[2], fit.forecast[3]);
    expect(hi).toBeGreaterThan(lo);
  });

  it("never returns negative demand", () => {
    const fit = holtWinters([500, 480, 460, 440, 420, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200], 7);
    expect(fit.forecast.every((v) => v >= 0)).toBe(true);
  });
});

describe("forecastDemand", () => {
  it("refuses to forecast with too little history", () => {
    const result = forecastDemand(series([10, 12, 11, 14, 9, 8, 15]), 7);
    expect(result.meetsThreshold).toBe(false);
    expect(result.points).toHaveLength(0);
    expect(result.reason).toMatch(/history/i);
  });

  it("produces 7 points, a band and a backtested MAPE", () => {
    const result = forecastDemand(series(synthetic(90)), 7);
    expect(result.meetsThreshold).toBe(true);
    expect(result.points).toHaveLength(7);
    expect(result.mape).not.toBeNull();
    expect(result.mape as number).toBeLessThan(15);
    for (const point of result.points) {
      expect(point.lower).toBeLessThanOrEqual(point.value);
      expect(point.upper).toBeGreaterThanOrEqual(point.value);
    }
  });

  it("states its method and seasonality so the UI can explain it", () => {
    const result = forecastDemand(series(synthetic(60)), 7);
    expect(result.method).toMatch(/Holt-Winters/i);
    expect(result.seasonality).toHaveLength(7);
  });
});

describe("capacityGap", () => {
  it("recommends extra trips when forecast exceeds seats", () => {
    const gap = capacityGap(600, 44, 10);
    expect(gap?.kind).toBe("over_capacity");
    expect(gap?.suggestion).toMatch(/Add/);
  });

  it("recommends trimming when seats are mostly empty", () => {
    const gap = capacityGap(120, 44, 10);
    expect(gap?.kind).toBe("under_utilised");
    expect(gap?.suggestion).toMatch(/Trim|downsize/);
  });

  it("returns nothing for a healthy load", () => {
    expect(capacityGap(300, 44, 10)).toBeNull();
  });
});
