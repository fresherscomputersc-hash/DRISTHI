export type ActionType =
  | "add_trip"
  | "trim_trip"
  | "redeploy"
  | "service_now"
  | "audit_revenue";

export type Recommendation = {
  id: string;
  action: ActionType;
  title: string;
  detail: string;
  expectedDailyInr: number;
  confidence: number;
  evidence: string[];
  href: string;
};

export function rankRecommendations(items: Recommendation[]): Recommendation[] {
  return [...items].sort((a, b) => {
    const aScore = a.expectedDailyInr * a.confidence;
    const bScore = b.expectedDailyInr * b.confidence;
    return bScore - aScore;
  });
}

export const ACTION_LABEL: Record<ActionType, string> = {
  add_trip: "Add trip",
  trim_trip: "Trim trip",
  redeploy: "Redeploy",
  service_now: "Service now",
  audit_revenue: "Audit revenue",
};
