import { TripStatus, type TripStatusType } from "@features/trips/domain";

export const TRIP_DETAIL_TAB_VALUES = [
  "overview",
  "route",
  "tracking",
  "cargo",
  "costs",
  "history",
] as const;

export type TripDetailTabValue = (typeof TRIP_DETAIL_TAB_VALUES)[number];

export function resolveTripDetailTab(raw: string | null): TripDetailTabValue {
  if (raw && TRIP_DETAIL_TAB_VALUES.includes(raw as TripDetailTabValue)) {
    return raw as TripDetailTabValue;
  }
  return "overview";
}

export function tripStatusNeedsTrackingContext(
  status: TripStatusType | undefined,
): boolean {
  return (
    status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED
  );
}

/**
 * Lista de cargas: tab Cargas, o Seguimiento cuando el viaje ya opera
 * (correlación parada↔mercancía).
 */
export function shouldFetchTripCargos(
  activeTab: TripDetailTabValue,
  tripId: string,
  status?: TripStatusType,
): boolean {
  if (!tripId) return false;
  if (activeTab === "cargo") return true;
  if (activeTab === "tracking" && tripStatusNeedsTrackingContext(status)) {
    return true;
  }
  return false;
}

/** Lista pesada de gastos: solo tab Costos (y si el rol puede ver costos). */
export function shouldFetchTripExpenses(
  activeTab: TripDetailTabValue,
  tripId: string,
  canFetchExpenses = true,
): boolean {
  return (
    canFetchExpenses && Boolean(tripId) && activeTab === "costs"
  );
}

/**
 * Summary ligero para badge pending del chrome — con tripId
 * cuando el rol puede ver costos (no depende de haber abierto Costos).
 */
export function shouldFetchTripExpensesSummary(
  _activeTab: TripDetailTabValue,
  tripId: string,
  canFetchExpenses = true,
): boolean {
  return canFetchExpenses && Boolean(tripId);
}

/** Timeline para badges/alertas del shell cuando el tab Seguimiento no está montado. */
export function shouldFetchTripTimelineForShell(
  activeTab: TripDetailTabValue,
  tripId: string,
  status: TripStatusType | undefined,
): boolean {
  if (!tripId || activeTab === "tracking") return false;
  return (
    status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED
  );
}

/**
 * Timeline compartido (misma query que Seguimiento) para reflejar progreso en Ruta.
 */
export function shouldFetchTripTimeline(
  activeTab: TripDetailTabValue,
  tripId: string,
  status: TripStatusType | undefined,
): boolean {
  if (!tripId) return false;
  if (activeTab === "tracking" || activeTab === "route") return true;
  return shouldFetchTripTimelineForShell(activeTab, tripId, status);
}
