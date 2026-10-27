export type Channel = "etm" | "oprs" | "counter";

export type TicketInput = {
  channel: Channel;
  ticketsSold: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
};

export type CollectionInput = {
  channel: Channel;
  cashAmount: number;
  onlineAmount: number;
  syncStatus: "synced" | "pending" | "failed";
};

export type TripFinancialInput = {
  tripId: string;
  serviceDate: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  depotId: string;
  status: "completed" | "cancelled" | "partial";
  departureTime: string;
  tickets: TicketInput[];
  collections: CollectionInput[];
  distanceKm: number;
  capacity: number;
  baseFarePerKm: number;
};

export type RevenueKind =
  | "ETM_SYNC_FAILURE"
  | "UNDER_COLLECTION"
  | "DUPLICATE_SALE"
  | "FARE_MISMATCH"
  | "UNRECORDED_TRIP";

export type Detection = {
  tripId: string;
  kind: RevenueKind;
  expected: number;
  collected: number;
  /** expected − collected; positive means money is missing. */
  variance: number;
  rupeesImpact: number;
  confidence: number;
  reasons: string[];
  channel: Channel | "all";
};

export const REVENUE_KIND_LABEL: Record<RevenueKind, string> = {
  ETM_SYNC_FAILURE: "ETM sync failure",
  UNDER_COLLECTION: "Under-collection",
  DUPLICATE_SALE: "Duplicate remittance",
  FARE_MISMATCH: "Fare mismatch",
  UNRECORDED_TRIP: "Unrecorded trip",
};

export const REVENUE_KIND_SEVERITY: Record<RevenueKind, "high" | "medium" | "low"> = {
  ETM_SYNC_FAILURE: "high",
  UNDER_COLLECTION: "high",
  DUPLICATE_SALE: "medium",
  FARE_MISMATCH: "medium",
  UNRECORDED_TRIP: "high",
};

export type CaseStatus = "open" | "acknowledged" | "assigned" | "resolved";

export type ConfidenceBand = { lower: number; upper: number };
