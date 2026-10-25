import type {
  MarginBasis,
  ProfitabilityAggregateItem,
  ProfitabilityTripItem,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";
import { resolveMarginBasis } from "@features/finance/domain";

export function tripsUseOperationalBasis(
  trips?: ProfitabilityTripsResponse,
): boolean {
  const hasOperational =
    trips?.aggregates.totalOperationalCost != null ||
    trips?.data.some((row) => row.operationalCost != null) === true;
  return (
    resolveMarginBasis({
      metaBasis: trips?.marginBasis,
      hasOperationalMetrics: hasOperational,
    }) === "operational"
  );
}

export function aggregateUsesOperationalBasis(
  items: readonly ProfitabilityAggregateItem[] | undefined,
  metaBasis?: MarginBasis,
): boolean {
  const hasOperational = items?.some((row) => row.totalOperationalCost != null) === true;
  return (
    resolveMarginBasis({
      metaBasis,
      hasOperationalMetrics: hasOperational,
    }) === "operational"
  );
}

export function tripDisplayCost(row: ProfitabilityTripItem, operational: boolean): number {
  if (operational && row.operationalCost != null) return row.operationalCost;
  return row.actualTotal;
}

export function tripDisplayMargin(
  row: ProfitabilityTripItem,
  operational: boolean,
): number | null {
  if (operational && row.operationalMargin !== undefined) {
    return row.operationalMargin;
  }
  return row.grossMargin;
}

export function tripDisplayMarginPct(
  row: ProfitabilityTripItem,
  operational: boolean,
): number | null {
  if (operational && row.operationalMarginPct !== undefined) {
    return row.operationalMarginPct;
  }
  return row.grossMarginPct;
}

export function tripDisplayStatus(
  row: ProfitabilityTripItem,
  operational: boolean,
) {
  if (operational && row.operationalProfitabilityStatus !== undefined) {
    return row.operationalProfitabilityStatus;
  }
  return row.profitabilityStatus;
}

export function aggregateDisplayCost(
  item: ProfitabilityAggregateItem,
  operational: boolean,
): number {
  if (operational && item.totalOperationalCost != null) {
    return item.totalOperationalCost;
  }
  return item.totalActual;
}

export function aggregateDisplayMargin(
  item: ProfitabilityAggregateItem,
  operational: boolean,
): number {
  if (operational && item.blendedOperationalMargin != null) {
    return item.blendedOperationalMargin;
  }
  return item.blendedMargin;
}

export function aggregateDisplayMarginPct(
  item: ProfitabilityAggregateItem,
  operational: boolean,
): number | null {
  if (operational && item.blendedOperationalMarginPct !== undefined) {
    return item.blendedOperationalMarginPct;
  }
  return item.blendedMarginPct;
}
