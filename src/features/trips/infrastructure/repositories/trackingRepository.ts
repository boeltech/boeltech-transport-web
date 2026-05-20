import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  CreateTrackingEventInput,
  StartTripTrackingInput,
  TrackingEvent,
  TrackingTimeline,
} from "@features/trips/domain";
import type {
  ApiTrackingEventResponse,
  ApiTrackingTimelineResponse,
} from "../api/tracking-types";
import {
  mapApiTrackingEvent,
  mapApiTrackingTimeline,
} from "../api/tracking-mappers";

const TRIPS_ENDPOINT = "/trips";

function toApiCreatePayload(input: CreateTrackingEventInput) {
  return {
    event_type: input.eventType,
    occurred_at: input.occurredAt,
    stop_id: input.stopId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy_meters: input.accuracyMeters,
    mileage: input.mileage,
    notes: input.notes,
    captured_via: input.capturedVia ?? "web",
    idempotency_key: input.idempotencyKey,
    payload: input.payload ?? {},
  };
}

function toApiStartPayload(input: StartTripTrackingInput) {
  return {
    mileage: input.mileage,
    latitude: input.latitude,
    longitude: input.longitude,
    notes: input.notes,
    occurred_at: input.occurredAt,
    idempotency_key: input.idempotencyKey,
  };
}

export class TrackingRepository {
  async getTimeline(
    tripId: string,
  ): Promise<{ data: TrackingTimeline; message?: string }> {
    const response = await apiClient.get<ApiSingleResponse<ApiTrackingTimelineResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/tracking/timeline`,
    );
    return {
      data: mapApiTrackingTimeline(response.data),
      message: response.message,
    };
  }

  async createEvent(
    tripId: string,
    input: CreateTrackingEventInput,
  ): Promise<{ data: TrackingEvent; message?: string }> {
    const response = await apiClient.post<ApiSingleResponse<ApiTrackingEventResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/tracking/events`,
      toApiCreatePayload(input),
    );
    return {
      data: mapApiTrackingEvent(response.data),
      message: response.message,
    };
  }

  async startTrip(
    tripId: string,
    input: StartTripTrackingInput,
  ): Promise<{ data: TrackingEvent; message?: string }> {
    const response = await apiClient.patch<ApiSingleResponse<ApiTrackingEventResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/start`,
      toApiStartPayload(input),
    );
    return {
      data: mapApiTrackingEvent(response.data),
      message: response.message,
    };
  }
}

export function createTrackingRepository() {
  return new TrackingRepository();
}

export const trackingRepository = new TrackingRepository();
