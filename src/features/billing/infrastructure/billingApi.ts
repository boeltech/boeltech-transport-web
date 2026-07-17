import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
} from "../domain/entities";
import {
  mapBillingEntitlements,
  mapBillingSubscription,
  mapBillingUsage,
  type ApiBillingEntitlements,
  type ApiBillingSubscription,
  type ApiBillingUsage,
} from "./mappers";

const BASE = "/billing";

export const billingApi = {
  getSubscription: async (): Promise<BillingSubscription> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingSubscription>>(
      `${BASE}/subscription`,
    );
    return mapBillingSubscription(response.data);
  },

  getUsage: async (): Promise<BillingUsage> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingUsage>>(
      `${BASE}/usage`,
    );
    return mapBillingUsage(response.data);
  },

  getEntitlements: async (): Promise<BillingEntitlements> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingEntitlements>>(
      `${BASE}/entitlements`,
    );
    return mapBillingEntitlements(response.data);
  },
};
