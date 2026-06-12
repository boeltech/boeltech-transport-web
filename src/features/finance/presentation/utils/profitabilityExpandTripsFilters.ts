import type {
  ProfitabilityDimension,
  ProfitabilityStatus,
  ProfitabilityTripItem,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";

const DETAIL_TRIPS_LIMIT = 100;

export function buildProfitabilityTripsFiltersForExpand(
  dimension: ProfitabilityDimension,
  key: string,
  profitabilityStatus: ProfitabilityStatus[] | undefined,
  scope?: ProfitabilityTripsFilters["scope"],
): ProfitabilityTripsFilters | null {
  const base: ProfitabilityTripsFilters = {
    page: 1,
    limit: DETAIL_TRIPS_LIMIT,
    sortBy: "grossMarginPct",
    sortOrder: "desc",
    profitabilityStatus,
    scope,
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
    case "month": {
      const match = /^(\d{4})-(\d{2})$/.exec(key);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]);
      const lastDay = new Date(year, month, 0).getDate();
      return {
        ...base,
        from: `${key}-01`,
        to: `${key}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    default:
      return null;
  }
}

export function filterTripsForExpandedGroup(
  dimension: ProfitabilityDimension,
  key: string,
  trips: ProfitabilityTripItem[],
): ProfitabilityTripItem[] {
  if (dimension === "client" && key === "unassigned") {
    return trips.filter((trip) => !trip.clientName);
  }
  return trips;
}
