import type { QueryClient } from "@tanstack/react-query";

import {
  TripStatus,
  tripQueryKeys,
  type CreateTrackingEventInput,
  type TrackingTimeline,
  type Trip,
  type TripStatusType,
} from "@features/trips/domain";

export type TripDetailTrackingPatch = {
  status?: TripStatusType;
  mileageStart?: number | null;
  mileageEnd?: number | null;
  actualArrival?: Date | null;
  actualDeparture?: Date | null;
};

/**
 * Parche puntual del detalle tras un evento de seguimiento (campos que el API
 * puede proyectar con retraso respecto al timeline).
 */
export function applyTripDetailTrackingPatch(
  queryClient: QueryClient,
  tripId: string,
  patch: TripDetailTrackingPatch,
): void {
  queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
    if (!previous) return previous;

    return {
      ...previous,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.actualArrival !== undefined
        ? { actualArrival: patch.actualArrival }
        : {}),
      ...(patch.actualDeparture !== undefined
        ? { actualDeparture: patch.actualDeparture }
        : {}),
      mileage: {
        start:
          patch.mileageStart !== undefined
            ? patch.mileageStart
            : previous.mileage.start,
        end:
          patch.mileageEnd !== undefined
            ? patch.mileageEnd
            : previous.mileage.end,
      },
    };
  });
}

export function buildTripDetailPatchFromTrackingEvent(
  event: CreateTrackingEventInput,
): TripDetailTrackingPatch | undefined {
  switch (event.eventType) {
    case "trip_arrived":
      return {
        status: TripStatus.COMPLETED,
        mileageEnd: event.mileage ?? null,
        actualArrival: event.occurredAt ? new Date(event.occurredAt) : null,
      };
    case "trip_dispatched":
      return {
        status: TripStatus.IN_PROGRESS,
        mileageStart: event.mileage ?? null,
        actualDeparture: event.occurredAt ? new Date(event.occurredAt) : null,
      };
    case "trip_departed":
      return {
        actualDeparture: event.occurredAt ? new Date(event.occurredAt) : null,
      };
    default:
      return undefined;
  }
}

/**
 * Fusiona paradas, fechas y odómetro del timeline en la caché del detalle.
 * No escribe `status` (lo controla el GET detail o un patch explícito).
 */
export function applyTimelineToTripDetailCache(
  queryClient: QueryClient,
  tripId: string,
  timeline: TrackingTimeline,
): void {
  queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
    if (!previous) return previous;

    return {
      ...previous,
      scheduledDeparture:
        timeline.trip.scheduledDeparture ?? previous.scheduledDeparture,
      scheduledArrival: timeline.trip.scheduledArrival ?? previous.scheduledArrival,
      actualDeparture: timeline.trip.actualDeparture ?? previous.actualDeparture,
      actualArrival: timeline.trip.actualArrival ?? previous.actualArrival,
      mileage: {
        start: timeline.trip.startMileage ?? previous.mileage.start,
        end: timeline.trip.endMileage ?? previous.mileage.end,
      },
      stops:
        timeline.stops.length > 0 ? timeline.stops : previous.stops,
    };
  });
}

/**
 * Refresca timeline y detalle tras un evento de seguimiento para que el tab Ruta
 * refleje paradas y progreso sin esperar al staleTime del detalle.
 * Secuencia: patch → refetch timeline → merge stops → invalidate detail → re-patch.
 */
export async function refetchTripTrackingViews(
  queryClient: QueryClient,
  tripId: string,
  patch?: TripDetailTrackingPatch,
): Promise<void> {
  if (patch) {
    applyTripDetailTrackingPatch(queryClient, tripId, patch);
  }

  await queryClient.refetchQueries({
    queryKey: tripQueryKeys.timeline(tripId),
  });

  const timeline = queryClient.getQueryData<TrackingTimeline>(
    tripQueryKeys.timeline(tripId),
  );

  if (timeline) {
    applyTimelineToTripDetailCache(queryClient, tripId, timeline);
  }

  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.detail(tripId),
    refetchType: "active",
  });

  if (patch) {
    applyTripDetailTrackingPatch(queryClient, tripId, patch);
  }
}
