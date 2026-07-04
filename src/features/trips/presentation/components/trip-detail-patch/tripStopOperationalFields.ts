import type { Trip, TripStop } from "@features/trips/domain";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

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
