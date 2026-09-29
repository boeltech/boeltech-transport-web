import { TripStatus, type TripStatusType } from "@features/trips/domain";

export const TRIP_DETAIL_TAB_VALUES = [
  "overview",
  "route",
  "tracking",
  "cargo",
  "costs",
] as const;

export type TripDetailTabValue = (typeof TRIP_DETAIL_TAB_VALUES)[number];

export function parseTripDetailTab(raw: string | null): TripDetailTabValue | null {
  if (raw && TRIP_DETAIL_TAB_VALUES.includes(raw as TripDetailTabValue)) {
    return raw as TripDetailTabValue;
  }
  return null;
}

export function resolveTripDetailTab(
  raw: string | null,
  fallback: TripDetailTabValue = "overview",
): TripDetailTabValue {
  return parseTripDetailTab(raw) ?? fallback;
}

export interface DefaultTripDetailTabInput {
  status: TripStatusType;
  routeReady: boolean;
  cargoCount: number | undefined;
  /** Portal cliente: siempre Resumen (D10). Staff/driver intactos. */
  isClientPortal?: boolean;
}

/** Conteo de cargas para tab default: live en DRAFT/SCHEDULED, embebido en otros estados. */
export function resolveCargoCountForDefaultTab(input: {
  status: TripStatusType;
  isLoadingLiveCargos: boolean;
  liveCargoCount: number;
  embeddedCargoCount: number | undefined;
}): number | undefined {
  const usesLiveCargos =
    input.status === TripStatus.DRAFT || input.status === TripStatus.SCHEDULED;
  if (!usesLiveCargos) return input.embeddedCargoCount;
  if (input.isLoadingLiveCargos) return undefined;
  return input.liveCargoCount;
}

/**
 * Tab inicial cuando no hay `?tab=`: hogar de fase, no cola de pendientes.
 * `null` = DRAFT con ruta lista y conteo de cargas aún desconocido; no pintar otro tab.
 */
export function resolveDefaultTripDetailTab(
  input: DefaultTripDetailTabInput,
): TripDetailTabValue | null {
  if (input.isClientPortal) return "overview";
  const { status, routeReady, cargoCount } = input;

  if (status === TripStatus.DRAFT) {
    if (!routeReady) return "route";
    if (cargoCount === undefined) return null;
    if (cargoCount === 0) return "cargo";
    return "overview";
  }

  if (status === TripStatus.SCHEDULED || status === TripStatus.IN_PROGRESS) {
    return "tracking";
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
