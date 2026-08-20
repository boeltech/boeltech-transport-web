/**
 * Fetchers de canvas intake (ADR-0078 F2/F3).
 * GET /trips/corridors, GET /trips/route-estimate y PUT /trips/:id/stops.
 * Query params en snake_case (apiClient.get no convierte params).
 */
import { apiClient } from "@shared/api";
import type {
  ClientCorridor,
  CreateStopInput,
  RouteEstimate,
  RouteEstimateParams,
  Trip,
} from "@features/trips/domain";
import type { ApiTripResponse } from "./api-types";
import {
  mapApiCorridor,
  mapApiRouteEstimate,
  type ApiCorridorResponse,
  type ApiRouteEstimateResponse,
} from "./canvas-mappers";
import { mapApiTrip } from "./mappers";

const CORRIDORS_ENDPOINT = "/trips/corridors";
const ROUTE_ESTIMATE_ENDPOINT = "/trips/route-estimate";

const DEFAULT_CORRIDORS_LIMIT = 10;

export const tripsApi = {
  async getCorridors(
    clientId: string,
    limit: number = DEFAULT_CORRIDORS_LIMIT,
  ): Promise<ClientCorridor[]> {
    const raw = await apiClient.get<{ data: ApiCorridorResponse[] }>(
      CORRIDORS_ENDPOINT,
      {
        params: {
          client_id: clientId,
          limit,
        },
      },
    );
    return (raw.data ?? []).map(mapApiCorridor);
  },

  async getRouteEstimate(
    params: RouteEstimateParams,
  ): Promise<RouteEstimate | null> {
    const query: Record<string, string> = {
      client_id: params.clientId,
    };
    if (params.corridorKey) {
      query.corridor_key = params.corridorKey;
    } else {
      if (params.originCity) query.origin_city = params.originCity;
      if (params.destinationCity) query.destination_city = params.destinationCity;
    }
    if (params.vehicleId) {
      query.vehicle_id = params.vehicleId;
    }

    const raw = await apiClient.get<{
      data: ApiRouteEstimateResponse | null;
      message?: string;
    }>(ROUTE_ESTIMATE_ENDPOINT, { params: query });

    if (raw.data == null) {
      return null;
    }
    return mapApiRouteEstimate(raw.data);
  },

  async replaceStops(
    tripId: string,
    stops: CreateStopInput[],
  ): Promise<Trip> {
    const raw = await apiClient.put<{
      data: { trip: ApiTripResponse };
      message?: string;
    }>(`/trips/${tripId}/stops`, { stops });
    return mapApiTrip(raw.data.trip);
  },
};
