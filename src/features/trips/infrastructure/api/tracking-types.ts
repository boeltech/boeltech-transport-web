import type { ApiStatusHistoryResponse, ApiStopResponse } from "./api-types";

export type ApiTrackingEventType =
  | "trip_dispatched"
  | "trip_departed"
  | "stop_arrived"
  | "stop_departed"
  | "trip_arrived"
  | "false_trip_declared"
  | "incident"
  | "note"
  | "cargo_picked_up"
  | "cargo_delivered"
  | "cargo_returned"
  | "cargo_cancelled";

export type ApiTrackingEventCategory =
  | "fiscal"
  | "operational"
  | "incident"
  | "note";

export type ApiTrackingCapturedVia = "web" | "mobile" | "gps_device" | "system";

export interface ApiTrackingEventResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  stop_id: string | null;
  event_type: ApiTrackingEventType;
  event_category: ApiTrackingEventCategory;
  occurred_at: string;
  recorded_at: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  mileage: number | null;
  payload: Record<string, unknown>;
  notes: string | null;
  captured_by: string | null;
  captured_via: ApiTrackingCapturedVia;
  idempotency_key: string | null;
}

export interface ApiTrackingTimelineResponse {
  trip: {
    id: string;
    trip_code: string;
    status:
      | "draft"
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled";
    scheduled_departure: string | null;
    scheduled_arrival: string | null;
    actual_departure: string | null;
    actual_arrival: string | null;
    start_mileage: number | null;
    end_mileage: number | null;
    has_open_incident: boolean;
    total_dist_rec: number | null;
  };
  progress: {
    stops_total: number;
    stops_completed: number;
    percent_complete: number;
    distance_planned_km: number | null;
    distance_actual_km: number | null;
    estimated_arrival: string | null;
  };
  stops: ApiStopResponse[];
  events: ApiTrackingEventResponse[];
  status_history: ApiStatusHistoryResponse[];
  map: {
    route_geojson: Record<string, unknown> | null;
    last_known_position: {
      latitude: number;
      longitude: number;
      occurred_at: string;
      accuracy_meters: number | null;
      event_id: string;
    } | null;
  };
}
