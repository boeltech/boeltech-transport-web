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
 * Fuente de verdad para el tab Ruta: timeline de Seguimiento cuando existe;
 * detalle del viaje como respaldo (borrador/programado sin timeline).
 */
export function buildTripRouteDetailView(
  trip: Trip,
  timeline: TrackingTimeline | undefined,
): TripRouteDetailView {
  const fallbackStops = getOrderedStops(trip.stops ?? []);

  if (!timeline) {
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
      status: timeline.trip.status,
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
