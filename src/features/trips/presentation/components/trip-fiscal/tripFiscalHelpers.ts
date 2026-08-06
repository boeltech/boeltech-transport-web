import {
  isValidSatRfc,
  preflightTripStopsRfc,
  resolveRfcRemitenteDestinatarioForUbicacion,
  type CpUbicacionRole,
  type StopRfcPreflightResult,
  type TripStopRfcPreflightInput,
} from "@boeltech/cfdi-domain";
import { stopTypeRequiresDeliveryCounterparty } from "@boeltech/cfdi-domain/validadores/address-payload-result";
import {
  TripStatus,
  type Trip,
  type TripStop,
  type TripStatusType,
} from "@features/trips/domain";
import {
  formatStopDisplayPrimaryLine,
  formatStopDisplayStreetLine,
} from "@features/trips/presentation/uiHelpers";
import { composeStopLocalityLine } from "@features/trips/presentation/stopLocalityDisplay";

function fiscalEditUbicacionRole(stop: TripStop): CpUbicacionRole {
  return stopTypeRequiresDeliveryCounterparty(stop.stopType)
    ? "Destino"
    : "Origen";
}

function resolveStopRfcForRole(
  stop: TripStop,
  role: CpUbicacionRole,
): string | null {
  return resolveRfcRemitenteDestinatarioForUbicacion({
    role,
    stopType: stop.stopType,
    remitenteRfc: stop.rfcRemitenteDestinatario,
    destinatarioRfc: stop.destinatarioRfc,
    legacyDeliveryRfc: stop.deliveryRfcRemitenteDestinatario,
  });
}

export function mapTripStopToPreflightInput(
  stop: TripStop,
): TripStopRfcPreflightInput {
  return {
    id: stop.id,
    order: stop.sequenceOrder,
    stopType: stop.stopType,
    deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario,
    addressRemitenteRfc: stop.rfcRemitenteDestinatario,
    addressDestinatarioRfc: stop.destinatarioRfc,
  };
}

export function getEffectiveStopRfc(stop: TripStop): string | null {
  return resolveStopRfcForRole(stop, fiscalEditUbicacionRole(stop));
}

export function getEffectiveStopNombre(stop: TripStop): string {
  const role = fiscalEditUbicacionRole(stop);
  if (role === "Destino") {
    return (
      stop.destinatarioNombre?.trim() ||
      stop.deliveryNombreRemitenteDestinatario?.trim() ||
      stop.nombreRemitenteDestinatario?.trim() ||
      ""
    );
  }
  return stop.nombreRemitenteDestinatario?.trim() ?? "";
}

export function isStopRfcInvalidForStamp(stop: TripStop): boolean {
  const effective = getEffectiveStopRfc(stop);
  if (!effective) return true;
  return !isValidSatRfc(effective);
}

export function shouldShowFiscalWarningChip(
  trip: Pick<Trip, "status" | "invoicing">,
  stop: TripStop,
): boolean {
  if (!canApplyStopFiscalCorrection(trip)) return false;
  return isStopRfcInvalidForStamp(stop);
}

export function canApplyStopFiscalCorrection(
  trip: Pick<Trip, "status" | "invoicing">,
): boolean {
  if (trip.status !== TripStatus.COMPLETED) return false;
  const invoiceStatus = trip.invoicing.invoiceStatus;
  if (
    invoiceStatus === "stamping" ||
    invoiceStatus === "stamped" ||
    invoiceStatus === "cancellation_pending"
  ) {
    return false;
  }
  return true;
}

export function shouldShowFiscalCorrectionChip(
  trip: Pick<Trip, "status" | "invoicing">,
  stop: TripStop,
): boolean {
  if (!canApplyStopFiscalCorrection(trip)) return false;
  return !shouldShowFiscalWarningChip(trip, stop);
}

export function buildFixSheetInitialValues(stop: TripStop): {
  rfc: string;
  nombre: string;
} {
  return {
    rfc: getEffectiveStopRfc(stop) ?? "",
    nombre: getEffectiveStopNombre(stop),
  };
}

export function runTripStopsPreflight(
  stops: readonly TripStop[],
): StopRfcPreflightResult {
  return preflightTripStopsRfc(stops.map(mapTripStopToPreflightInput));
}

export function collectStopsFromTrips(trips: readonly Trip[]): TripStop[] {
  return trips.flatMap((trip) => trip.stops ?? []);
}

export function findStopInTrips(
  trips: readonly Trip[],
  stopId: string,
): { trip: Trip; stop: TripStop } | null {
  for (const trip of trips) {
    const stop = (trip.stops ?? []).find((item) => item.id === stopId);
    if (stop) return { trip, stop };
  }
  return null;
}

export function resolveTripIdForStop(
  stopId: string,
  options: {
    trip?: Trip;
    trips?: readonly Trip[];
    fallbackTripIds?: readonly string[];
  },
): string | null {
  if (options.trip) {
    const inTrip = (options.trip.stops ?? []).some((stop) => stop.id === stopId);
    if (inTrip) return options.trip.id;
  }

  if (options.trips?.length) {
    const match = findStopInTrips(options.trips, stopId);
    if (match) return match.trip.id;
  }

  if (options.fallbackTripIds?.length === 1) {
    return options.fallbackTripIds[0] ?? null;
  }

  return null;
}

export function formatStopLocation(stop: TripStop): string {
  const locality = composeStopLocalityLine(stop).trim();
  const streetPart = stop.locationName?.trim()
    ? formatStopDisplayStreetLine(stop)
    : formatStopDisplayPrimaryLine(stop);
  const colonia = stop.colonia?.trim() || null;
  const parts = [streetPart, colonia, locality].filter(
    (part) => part != null && String(part).trim() !== "",
  );
  const line = parts.join(", ");
  return line || "Sin dirección";
}

export function isTripCompletedForFiscalChip(status: TripStatusType): boolean {
  return status === TripStatus.COMPLETED;
}
