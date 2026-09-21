import {
  apiClient,
  type ApiActionResponse,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  BillingAccess,
  BillingArrears,
  BillingEntitlements,
  BillingPaymentMethod,
  BillingSetupIntent,
  BillingSubscription,
  BillingUsage,
  SaasInvoicePayResult,
} from "../domain/entities";
import {
  mapBillingAccess,
  mapBillingArrears,
  mapBillingEntitlements,
  mapBillingPaymentMethod,
  mapBillingSetupIntent,
  mapBillingSubscription,
  mapBillingUsage,
  mapSaasInvoicePayResult,
  type ApiBillingAccess,
  type ApiBillingArrears,
  type ApiBillingEntitlements,
  type ApiBillingPaymentMethod,
  type ApiBillingSetupIntent,
  type ApiBillingSubscription,
  type ApiBillingUsage,
  type ApiSaasInvoicePayResult,
} from "./mappers";

const BASE = "/billing";

export const billingApi = {
  getAccess: async (): Promise<BillingAccess> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingAccess>>(
      `${BASE}/access`,
    );
    return mapBillingAccess(response.data);
  },

  getSubscription: async (): Promise<BillingSubscription | null> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiBillingSubscription | null>
    >(`${BASE}/subscription`);
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
    const response = await apiClient.get<
      ApiSingleResponse<ApiBillingEntitlements>
    >(`${BASE}/entitlements`);
    return mapBillingEntitlements(response.data);
  },

  getArrears: async (): Promise<BillingArrears> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingArrears>>(
      `${BASE}/arrears`,
    );
    return mapBillingArrears(response.data);
  },

  listPaymentMethods: async (): Promise<BillingPaymentMethod[]> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiBillingPaymentMethod[]>
    >(`${BASE}/payment-methods`);
    return (response.data ?? []).map(mapBillingPaymentMethod);
  },

  createSetupIntent: async (): Promise<BillingSetupIntent> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiBillingSetupIntent>
    >(`${BASE}/payment-methods/setup-intent`);
    return mapBillingSetupIntent(response.data);
  },

  confirmSetupIntent: async (
    setupIntentId: string,
  ): Promise<BillingPaymentMethod> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiBillingPaymentMethod>
    >(`${BASE}/payment-methods/confirm`, { setupIntentId });
    return mapBillingPaymentMethod(response.data);
  },

  setDefaultPaymentMethod: async (
    paymentMethodId: string,
  ): Promise<BillingPaymentMethod> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiBillingPaymentMethod>
    >(`${BASE}/payment-methods/${paymentMethodId}/default`);
    return mapBillingPaymentMethod(response.data);
  },

  deletePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.delete<ApiActionResponse>(
      `${BASE}/payment-methods/${paymentMethodId}`,
    );
  },

  paySaasInvoice: async (invoiceId: string): Promise<SaasInvoicePayResult> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiSaasInvoicePayResult>
    >(`${BASE}/saas-invoices/${invoiceId}/pay`);
    return mapSaasInvoicePayResult(response.data);
  },
};
