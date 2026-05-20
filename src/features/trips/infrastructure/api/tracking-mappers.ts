import { sortTrackingEventsForTimeline } from "@boeltech/cfdi-domain";
import type {
  TrackingEvent,
  TrackingTimeline,
  TrackingTimelineMapPosition,
} from "@features/trips/domain";
import type {
  ApiTrackingEventResponse,
  ApiTrackingTimelineResponse,
} from "./tracking-types";
import { mapApiStatusHistory, mapApiStop } from "./mappers";

function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapApiTrackingEvent(
  api: ApiTrackingEventResponse,
): TrackingEvent {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    stopId: api.stop_id,
    eventType: api.event_type,
    eventCategory: api.event_category,
    occurredAt: new Date(api.occurred_at),
    recordedAt: new Date(api.recorded_at),
    latitude: api.latitude,
    longitude: api.longitude,
    accuracyMeters: api.accuracy_meters,
    mileage: api.mileage,
    payload: api.payload ?? {},
    notes: api.notes,
    capturedBy: api.captured_by,
    capturedVia: api.captured_via,
    idempotencyKey: api.idempotency_key,
  };
}

function mapLastKnownPosition(
  api: ApiTrackingTimelineResponse["map"]["last_known_position"],
): TrackingTimelineMapPosition | null {
  if (!api) return null;
  return {
    latitude: api.latitude,
    longitude: api.longitude,
    occurredAt: new Date(api.occurred_at),
    accuracyMeters: api.accuracy_meters,
    eventId: api.event_id,
  };
}

export function mapApiTrackingTimeline(
  api: ApiTrackingTimelineResponse,
): TrackingTimeline {
  return {
    trip: {
      id: api.trip.id,
      tripCode: api.trip.trip_code,
      status: api.trip.status,
      scheduledDeparture: toDateOrNull(api.trip.scheduled_departure),
      scheduledArrival: toDateOrNull(api.trip.scheduled_arrival),
      actualDeparture: toDateOrNull(api.trip.actual_departure),
      actualArrival: toDateOrNull(api.trip.actual_arrival),
      startMileage: api.trip.start_mileage,
      endMileage: api.trip.end_mileage,
      hasOpenIncident: api.trip.has_open_incident,
      totalDistRec: api.trip.total_dist_rec,
    },
    progress: {
      stopsTotal: api.progress.stops_total,
      stopsCompleted: api.progress.stops_completed,
      percentComplete: api.progress.percent_complete,
      distancePlannedKm: api.progress.distance_planned_km,
      distanceActualKm: api.progress.distance_actual_km,
      estimatedArrival: toDateOrNull(api.progress.estimated_arrival),
    },
    stops: api.stops.map(mapApiStop),
    events: sortTrackingEventsForTimeline(api.events.map(mapApiTrackingEvent)),
    statusHistory: api.status_history.map(mapApiStatusHistory),
    map: {
      routeGeojson: api.map.route_geojson,
      lastKnownPosition: mapLastKnownPosition(api.map.last_known_position),
    },
  };
}
