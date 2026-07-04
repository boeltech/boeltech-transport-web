import { apiClient } from "@shared/api";
import type {
  PatchTripFiscalPayload,
  PatchTripFiscalResult,
} from "@features/trips/domain/tripFiscal.types";
import type { ApiTripResponse } from "./api/api-types";
import { mapTripResponse } from "./api/mappers";

const TRIPS_ENDPOINT = "/trips";

type PatchTripFiscalApiResponse = {
  data: ApiTripResponse;
  message?: string;
};

export const tripFiscalApi = {
  async patch(
    tripId: string,
    payload: PatchTripFiscalPayload,
  ): Promise<PatchTripFiscalResult> {
    const response = await apiClient.patch<PatchTripFiscalApiResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/fiscal`,
      payload,
    );

    const mapped = mapTripResponse({ data: response.data });
    return {
      trip: mapped.data,
      message: mapped.message ?? response.message ?? "Datos fiscales actualizados",
    };
  },
};
