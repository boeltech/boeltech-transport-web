import type { Trip, TripStop } from "@features/trips/domain";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;

export type StopFiscalStatus = "ok" | "pending" | "invalid";

export type TripStopOperationalValues = {
  stopId: string;
  sequenceOrder: number;
  estimatedArrival: string;
  estimatedDeparture: string;
  distanceFromPreviousKm: string;
  rfcRemitenteDestinatario: string;
  nombreRemitenteDestinatario: string;
  deliveryRfcRemitenteDestinatario: string;
  deliveryNombreRemitenteDestinatario: string;
};

export type TripScheduleFormValues = {
  scheduledDeparture: string;
  scheduledArrival: string;
};

export function mapTripStopToOperationalValues(stop: TripStop): TripStopOperationalValues {
  return {
    stopId: stop.id,
    sequenceOrder: stop.sequenceOrder,
    estimatedArrival: stop.estimatedArrival
      ? utcIsoToLocalInput(stop.estimatedArrival.toISOString())
      : "",
    estimatedDeparture: stop.estimatedDeparture
      ? utcIsoToLocalInput(stop.estimatedDeparture.toISOString())
      : "",
    distanceFromPreviousKm:
      stop.distanceFromPreviousKm == null ? "" : String(stop.distanceFromPreviousKm),
    rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario ?? "",
    nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario ?? "",
    deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario ?? "",
    deliveryNombreRemitenteDestinatario:
      stop.deliveryNombreRemitenteDestinatario ?? "",
  };
}

export function mapTripToScheduleFormValues(trip: Trip): TripScheduleFormValues {
  return {
    scheduledDeparture: utcIsoToLocalInput(trip.scheduledDeparture.toISOString()),
    scheduledArrival: trip.scheduledArrival
      ? utcIsoToLocalInput(trip.scheduledArrival.toISOString())
      : "",
  };
}

function normalizeRfc(value: string): string {
  return value.trim().toUpperCase();
}

export function getStopFiscalStatus(
  stop: Pick<
    TripStopOperationalValues,
    "rfcRemitenteDestinatario" | "deliveryRfcRemitenteDestinatario"
  >,
): StopFiscalStatus {
  const candidate =
    normalizeRfc(stop.deliveryRfcRemitenteDestinatario) ||
    normalizeRfc(stop.rfcRemitenteDestinatario);
  if (!candidate) return "pending";
  if (!RFC_REGEX.test(candidate)) return "invalid";
  return "ok";
}

export function validateStopOperationalFields(
  values: TripStopOperationalValues,
): string[] {
  const issues: string[] = [];
  const status = getStopFiscalStatus(values);
  if (status === "pending") {
    issues.push("Captura RFC remitente/destinatario o RFC de entrega.");
  } else if (status === "invalid") {
    issues.push("El RFC capturado no cumple formato válido.");
  }

  if (values.sequenceOrder > 0) {
    const parsedDistance =
      values.distanceFromPreviousKm.trim() === ""
        ? undefined
        : Number(values.distanceFromPreviousKm);
    if (
      parsedDistance == null ||
      !Number.isFinite(parsedDistance) ||
      parsedDistance < 0
    ) {
      issues.push("Distancia desde parada anterior inválida.");
    }
  }

  return issues;
}
