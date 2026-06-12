import type { TripListItem, TripStatusType } from "@features/trips/domain";
import { TRIP_STATUS_LABELS } from "@features/trips";
import { getTripExportHeaders } from "../copy/reportsCopy";

const MEXICO_TIMEZONE = "America/Mexico_City";

export interface TripExportFilters {
  status?: TripStatusType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function formatTripExportDateTime(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MEXICO_TIMEZONE,
  }).replace("T", " ");
}

export function mapTripListItemToCsvRow(trip: TripListItem): Array<string | number> {
  return [
    trip.tripCode,
    trip.client?.legalName ?? "",
    trip.originCity,
    trip.originState ?? "",
    trip.destinationCity,
    trip.destinationState ?? "",
    TRIP_STATUS_LABELS[trip.status],
    formatTripExportDateTime(trip.scheduledDeparture),
    formatTripExportDateTime(trip.scheduledArrival),
    trip.baseRate,
    trip.vehicle.unitNumber,
    trip.driver.fullName,
  ];
}

export function mapTripsToCsvRows(trips: TripListItem[]): Array<Array<string | number>> {
  return trips.map(mapTripListItemToCsvRow);
}

export { getTripExportHeaders };
