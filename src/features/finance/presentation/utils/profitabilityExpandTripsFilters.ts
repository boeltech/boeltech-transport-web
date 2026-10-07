import type { MarginAnalysisDimension } from "@features/finance/application";
import type {
  ProfitabilityTripItem,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";

export const DETAIL_TRIPS_LIMIT = 100;

export interface ProfitabilityExpandContext {
  scope?: ProfitabilityTripsFilters["scope"];
  from?: string;
  to?: string;
  /** Solo viajes con pérdida al abrir el grupo (no cambia totales ni la tabla). */
  lossOnly?: boolean;
}

export function buildProfitabilityTripsFiltersForExpand(
  dimension: MarginAnalysisDimension,
  key: string,
  { scope, from, to, lossOnly = false }: ProfitabilityExpandContext = {},
): ProfitabilityTripsFilters | null {
  const base: ProfitabilityTripsFilters = {
    page: 1,
    limit: DETAIL_TRIPS_LIMIT,
    sortBy: "grossMarginPct",
    sortOrder: lossOnly ? "asc" : "desc",
    profitabilityStatus: lossOnly ? ["loss"] : undefined,
    scope,
    from,
    to,
  };

  switch (dimension) {
    case "client":
      if (key === "unassigned") {
        return base;
      }
      return { ...base, clientId: key };
    case "vehicle":
      return { ...base, vehicleId: key };
    case "driver":
      return { ...base, driverId: key };
    case "route": {
      const separator = " -> ";
      const splitAt = key.indexOf(separator);
      if (splitAt < 0) return null;
      return {
        ...base,
        origin: key.slice(0, splitAt),
        destination: key.slice(splitAt + separator.length),
      };
    }
    default:
      return null;
  }
}

export function filterTripsForExpandedGroup(
  dimension: MarginAnalysisDimension,
  key: string,
  trips: ProfitabilityTripItem[],
): ProfitabilityTripItem[] {
  if (dimension === "client" && key === "unassigned") {
    return trips.filter((trip) => !trip.clientName);
  }
  return trips;
}
