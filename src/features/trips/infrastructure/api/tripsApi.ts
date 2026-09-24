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
import type { ApiCreateTripWarning, ApiTripResponse } from "./api-types";
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

  /** ADR-0093 — append-only mid-trip.
   * @deprecated E1 — path de producto = {@link replanStops}.
   */
  async appendStops(
    tripId: string,
    stops: CreateStopInput[],
  ): Promise<Trip> {
    const raw = await apiClient.post<{
      data: { trip: ApiTripResponse };
      message?: string;
    }>(`/trips/${tripId}/stops:append`, { stops });
    return mapApiTrip(raw.data.trip);
  },

  /** ADR-0093 E1 — replan de paradas pending (insert/modify/delete/reorder). */
  async replanStops(
    tripId: string,
    pendingStops: Array<CreateStopInput & { id?: string }>,
  ): Promise<Trip> {
    const raw = await apiClient.put<{
      data: { trip: ApiTripResponse };
      message?: string;
    }>(`/trips/${tripId}/stops:replan`, { pendingStops });
    return mapApiTrip(raw.data.trip);
  },

  /** ADR-0093 — reasignación de flota (warnings soft vs draft: OC-D1 / F2). */
  async patchFleet(
    tripId: string,
    data: {
      vehicleId?: string;
      driverId?: string;
      trailers?: Array<{ trailerId: string; position: 1 | 2 }>;
      internalStaff?: Array<{
        employeeId: string;
        internalRole: "secondary_driver" | "helper";
        isPaymentResponsible?: boolean;
        paymentNotes?: string | null;
      }>;
      allowExpiredDocs?: boolean;
    },
  ): Promise<{
    trip: Trip;
    warnings?: Array<{
      code: string;
      message: string;
      vehicleId?: string;
      driverId?: string;
      trailerId?: string;
      conflictingTripId?: string;
      conflictingTripCode?: string;
    }>;
  }> {
    const raw = await apiClient.patch<{
      data: { trip: ApiTripResponse };
      message?: string;
      warnings?: ApiCreateTripWarning[];
    }>(`/trips/${tripId}/fleet`, data);

    const warnings = raw.warnings?.map((warning) => ({
      code: warning.code,
      message: warning.message,
      vehicleId: warning.vehicle_id,
      driverId: warning.driver_id,
      trailerId: warning.trailer_id,
      conflictingTripId: warning.conflicting_trip_id,
      conflictingTripCode: warning.conflicting_trip_code,
    }));

    return {
      trip: mapApiTrip(raw.data.trip),
      ...(warnings && warnings.length > 0 ? { warnings } : {}),
    };
  },

  /** ADR-0093 — mutar tarifa base. */
  async patchBaseRate(tripId: string, baseRate: number): Promise<Trip> {
    const raw = await apiClient.patch<{
      data: { trip: ApiTripResponse };
      message?: string;
    }>(`/trips/${tripId}/base-rate`, { baseRate });
    return mapApiTrip(raw.data.trip);
  },

  /**
   * ADR-0096 — cobro operativo en efectivo (`operational_cash_*`).
   * Solo viajes `sin_cfdi_efectivo`. No escribe `cobrado_viaje`.
   */
  async patchOperationalCash(
    tripId: string,
    body: { amount: number; collectedAt?: string; note?: string },
  ): Promise<Trip> {
    const raw = await apiClient.patch<{
      data: { trip: ApiTripResponse };
      message?: string;
    }>(`/trips/${tripId}/operational-cash`, body);
    return mapApiTrip(raw.data.trip);
  },
};
