import {
  calculateStopsProgress,
  getOrderedStops,
  type TrackingTimeline,
  type Trip,
  type TripStop,
} from "@features/trips/domain";

export type TripRouteDetailView = {
  trip: Trip;
  orderedStops: TripStop[];
  progress: number;
};

/**
 * Fuente de verdad para el tab Ruta: timeline de Seguimiento cuando existe y
 * su status operativo coincide con el GET detail; detalle como respaldo.
 * El `status` del viaje siempre viene del detail (nunca del timeline cacheado).
 */
export function buildTripRouteDetailView(
  trip: Trip,
  timeline: TrackingTimeline | undefined,
): TripRouteDetailView {
  const fallbackStops = getOrderedStops(trip.stops ?? []);

  if (!timeline || timeline.trip.status !== trip.status) {
    return {
      trip,
      orderedStops: fallbackStops,
      progress: calculateStopsProgress(trip.stops ?? []),
    };
  }

  const orderedStops = getOrderedStops(timeline.stops);

  return {
    trip: {
      ...trip,
      status: trip.status,
      scheduledDeparture:
        timeline.trip.scheduledDeparture ?? trip.scheduledDeparture,
      scheduledArrival: timeline.trip.scheduledArrival ?? trip.scheduledArrival,
      actualDeparture: timeline.trip.actualDeparture ?? trip.actualDeparture,
      actualArrival: timeline.trip.actualArrival ?? trip.actualArrival,
      mileage: {
        start: timeline.trip.startMileage ?? trip.mileage.start,
        end: timeline.trip.endMileage ?? trip.mileage.end,
      },
      stops: orderedStops,
    },
    orderedStops,
    progress: timeline.progress.percentComplete,
  };
}
