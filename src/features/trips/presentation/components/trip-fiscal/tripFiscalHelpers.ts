import {
  isValidSatRfc,
  preflightTripStopsRfc,
  resolveEffectiveStopRfcForCartaPorte,
  type StopRfcPreflightResult,
  type TripStopRfcPreflightInput,
} from "@boeltech/cfdi-domain";
import {
  TripStatus,
  type Trip,
  type TripStop,
  type TripStatusType,
} from "@features/trips/domain";

export function mapTripStopToPreflightInput(
  stop: TripStop,
): TripStopRfcPreflightInput {
  return {
    id: stop.id,
    order: stop.sequenceOrder,
    deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario,
    addressRemitenteRfc: stop.rfcRemitenteDestinatario,
  };
}

export function getEffectiveStopRfc(stop: TripStop): string | null {
  return resolveEffectiveStopRfcForCartaPorte({
    delivery_rfc_remitente_destinatario: stop.deliveryRfcRemitenteDestinatario,
    address_remitente_rfc: stop.rfcRemitenteDestinatario,
  });
}

export function getEffectiveStopNombre(stop: TripStop): string {
  const delivery = stop.deliveryNombreRemitenteDestinatario?.trim();
  if (delivery) return delivery;
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
  if (trip.status !== TripStatus.COMPLETED) return false;
  if (trip.invoicing.invoiceStatus === "stamped") return false;
  return isStopRfcInvalidForStamp(stop);
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
  const city = stop.city?.trim();
  const state = stop.state?.trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || stop.address || "Sin ubicación";
}

export function isTripCompletedForFiscalChip(status: TripStatusType): boolean {
  return status === TripStatus.COMPLETED;
}
