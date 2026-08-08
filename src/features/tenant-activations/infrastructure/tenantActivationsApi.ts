import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  TenantActivationAcceptResult,
  TenantActivationVerifyPayload,
} from "../domain/entities";
import {
  mapTenantActivationAccept,
  mapTenantActivationVerify,
  type ApiTenantActivationAccept,
  type ApiTenantActivationVerify,
} from "./mappers";

const BASE = "/tenant-activations";

/**
 * API pública de activación del admin inicial (sin JWT platform).
 * No escribe cookies/storage platform ni emite sesión tenant.
 */
export const tenantActivationsApi = {
  verify: async (token: string): Promise<TenantActivationVerifyPayload> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiTenantActivationVerify>
    >(`${BASE}/verify/${encodeURIComponent(token)}`);
    return mapTenantActivationVerify(response.data);
  },

  accept: async (input: {
    token: string;
  }): Promise<{ message: string; data: TenantActivationAcceptResult }> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiTenantActivationAccept>
    >(`${BASE}/accept`, { token: input.token });
    return {
      message: response.message ?? "OK",
      data: mapTenantActivationAccept(response.data),
    };
  },
};
