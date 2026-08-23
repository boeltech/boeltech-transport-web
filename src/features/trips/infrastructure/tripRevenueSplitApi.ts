/**
 * Trip revenue split API (ADR-0081).
 * GET/PUT/DELETE /trips/:tripId/revenue-split
 */
import { apiClient } from "@shared/api";
import type {
  TripRevenueSplit,
  UpsertTripRevenueSplitInput,
} from "@features/trips/domain";
import type { ApiTripRevenueSplitResponse } from "./api/api-types";
import { mapApiTripRevenueSplit } from "./api/mappers";

const tripsEndpoint = (tripId: string) => `/trips/${tripId}/revenue-split`;

type SplitEnvelope = {
  data: ApiTripRevenueSplitResponse | null;
  message?: string;
};

export const tripRevenueSplitApi = {
  async get(tripId: string): Promise<TripRevenueSplit | null> {
    const response = await apiClient.get<SplitEnvelope>(tripsEndpoint(tripId));
    if (response.data == null) return null;
    return mapApiTripRevenueSplit(response.data);
  },

  async upsert(
    tripId: string,
    input: UpsertTripRevenueSplitInput,
  ): Promise<TripRevenueSplit> {
    const response = await apiClient.put<SplitEnvelope>(tripsEndpoint(tripId), {
      basisAmount: input.basisAmount,
      currency: input.currency,
      tripClientId: input.tripClientId,
      activate: input.activate,
      notes: input.notes,
      legs: input.legs.map((leg) => ({
        clientId: leg.clientId,
        sharePercent: leg.sharePercent,
        suggestedCartaPorte: leg.suggestedCartaPorte,
      })),
    });
    if (response.data == null) {
      throw new Error("El API no devolvió el prorrateo actualizado");
    }
    return mapApiTripRevenueSplit(response.data);
  },

  async remove(tripId: string): Promise<TripRevenueSplit | null> {
    const response = await apiClient.delete<SplitEnvelope>(
      tripsEndpoint(tripId),
    );
    if (response.data == null) return null;
    return mapApiTripRevenueSplit(response.data);
  },
};
