import type {
  ProfitabilityScope,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";

export function showsMarginForScope(scope: ProfitabilityScope): boolean {
  return (
    scope === "operational" ||
    scope === "with_in_progress" ||
    scope === "all"
  );
}

export function aggregateMetricForBarList(
  scope: ProfitabilityScope,
  row: {
    totalRevenue: number;
    totalActual: number;
    blendedMargin: number;
  },
): number {
  if (scope === "pipeline") {
    return row.totalRevenue;
  }
  if (scope === "cancelled") {
    return row.totalActual;
  }
  return row.totalRevenue;
}

export function tripCountLabel(count: number): string {
  return `${count} viaje${count === 1 ? "" : "s"}`;
}

export type ProfitabilityAggregates = ProfitabilityTripsResponse["aggregates"];
