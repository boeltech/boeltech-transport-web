import type { TripStop, TripStatusHistory } from "./entities";
import type { TripStatusType } from "./enums";

export type TrackingEventType =
  | "trip_dispatched"
  | "trip_departed"
  | "stop_arrived"
  | "stop_departed"
  | "trip_arrived"
  | "incident"
  | "note"
  | "cargo_picked_up"
  | "cargo_delivered"
  | "cargo_returned"
  | "cargo_cancelled";

export type TrackingEventCategory =
  | "fiscal"
  | "operational"
  | "incident"
  | "note";

export type TrackingCapturedVia = "web" | "mobile" | "gps_device" | "system";

export interface TrackingEvent {
  id: string;
  tenantId: string;
  tripId: string;
  stopId: string | null;
  eventType: TrackingEventType;
  eventCategory: TrackingEventCategory;
  occurredAt: Date;
  recordedAt: Date;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  mileage: number | null;
  payload: Record<string, unknown>;
  notes: string | null;
  capturedBy: string | null;
  capturedVia: TrackingCapturedVia;
  idempotencyKey: string | null;
}

export interface TrackingTimelineProgress {
  stopsTotal: number;
  stopsCompleted: number;
  percentComplete: number;
  distancePlannedKm: number | null;
  distanceActualKm: number | null;
  estimatedArrival: Date | null;
}

export interface TrackingTimelineMapPosition {
  latitude: number;
  longitude: number;
  occurredAt: Date;
  accuracyMeters: number | null;
  eventId: string;
}

export interface TrackingTimeline {
  trip: {
    id: string;
    tripCode: string;
    status: TripStatusType;
    scheduledDeparture: Date | null;
    scheduledArrival: Date | null;
    actualDeparture: Date | null;
    actualArrival: Date | null;
    startMileage: number | null;
    endMileage: number | null;
    hasOpenIncident: boolean;
    totalDistRec: number | null;
  };
  progress: TrackingTimelineProgress;
  stops: TripStop[];
  events: TrackingEvent[];
  statusHistory: TripStatusHistory[];
  map: {
    routeGeojson: Record<string, unknown> | null;
    lastKnownPosition: TrackingTimelineMapPosition | null;
  };
}

export interface CreateTrackingEventInput {
  eventType: TrackingEventType;
  occurredAt: string;
  stopId?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  mileage?: number;
  notes?: string;
  idempotencyKey?: string;
  capturedVia?: TrackingCapturedVia;
  payload?: Record<string, unknown>;
}

export interface StartTripTrackingInput {
  mileage: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  occurredAt?: string;
  idempotencyKey?: string;
}
