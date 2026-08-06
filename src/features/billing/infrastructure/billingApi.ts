import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  BillingArrears,
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
} from "../domain/entities";
import {
  mapBillingArrears,
  mapBillingEntitlements,
  mapBillingSubscription,
  mapBillingUsage,
  type ApiBillingArrears,
  type ApiBillingEntitlements,
  type ApiBillingSubscription,
  type ApiBillingUsage,
} from "./mappers";

const BASE = "/billing";

export const billingApi = {
  getSubscription: async (): Promise<BillingSubscription | null> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingSubscription | null>>(
      `${BASE}/subscription`,
    );
    if (response.data == null) {
      return null;
    }
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

  getArrears: async (): Promise<BillingArrears> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingArrears>>(
      `${BASE}/arrears`,
    );
    return mapBillingArrears(response.data);
  },
};
