import { apiClient } from "@shared/api";
import type {
  PatchTripStopFiscalPayload,
  PatchTripStopFiscalResult,
} from "@features/trips/domain/tripStopFiscal.types";
import type { ApiStopResponse } from "./api/api-types";
import { mapStopResponse } from "./api/mappers";

const TRIPS_ENDPOINT = "/trips";

type PatchTripStopFiscalApiResponse = {
  data: ApiStopResponse;
  message?: string;
  client_updated?: boolean;
  clientUpdated?: boolean;
};

export const tripStopFiscalApi = {
  async patch(
    tripId: string,
    stopId: string,
    payload: PatchTripStopFiscalPayload,
  ): Promise<PatchTripStopFiscalResult> {
    const response = await apiClient.patch<PatchTripStopFiscalApiResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/stops/${stopId}/fiscal`,
      payload,
    );

    const mapped = mapStopResponse({ data: response.data });
    const clientUpdated =
      response.clientUpdated ?? response.client_updated ?? false;

    return {
      stop: mapped.data,
      clientUpdated,
      message: mapped.message ?? "Datos fiscales actualizados",
    };
  },
};
