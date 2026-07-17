import {
  apiClient,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import type {
  CreatePlatformTenantPayload,
  PlatformBillingPlan,
  PlatformMetrics,
  PlatformTenantDetail,
  PlatformTenantListItem,
  PlatformTenantsQueryParams,
  PlatformUserJSON,
  UpdateDeclaredFleetPayload,
  UpdatePlatformTenantStatusPayload,
  PlatformAuditLogItem,
  PlatformAuditLogQueryParams,
  PlatformTenantSubscription,
  PlatformTenantStampUsage,
  PlatformTenantEntitlements,
  PlatformModuleCatalogItem,
  PlatformStampPackCatalogItem,
  PlatformTenantStampPackBalance,
  UpsertPlatformTenantSubscriptionPayload,
  MutatePlatformEntitlementPayload,
  GrantPlatformStampPackPayload,
} from "../domain/entities";
import {
  mapPlatformBillingPlan,
  mapPlatformMetrics,
  mapPlatformTenantDetail,
  mapPlatformTenantListItem,
  mapPlatformUser,
  mapPlatformAuditLogItem,
  mapPlatformTenantSubscription,
  mapPlatformTenantStampUsage,
  mapPlatformTenantEntitlements,
  mapPlatformModuleCatalogItem,
  mapPlatformStampPackCatalogItem,
  mapPlatformTenantStampPackBalance,
  toApiCreatePlatformTenant,
  toApiUpdateDeclaredFleet,
  toApiUpdatePlatformTenantStatus,
  type ApiPlatformBillingPlan,
  type ApiPlatformMetrics,
  type ApiPlatformTenantListItem,
  type ApiPlatformUser,
  type ApiPlatformAuditLogItem,
} from "./mappers";
import type {
  ApiBillingEntitlements,
  ApiBillingSubscription,
  ApiBillingUsage,
} from "@features/billing/infrastructure/mappers";

const BASE = "/platform";

export const platformApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: PlatformUserJSON;
  }> => {
    const response = await apiClient.post<
      ApiSingleResponse<{
        access_token: string;
        refresh_token: string;
        user: ApiPlatformUser;
      }>
    >(`${BASE}/auth/login`, credentials);

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      user: mapPlatformUser(response.data.user),
    };
  },

  refresh: async (
    refreshToken: string,
  ): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<
      ApiSingleResponse<{ access_token: string }>
    >(`${BASE}/auth/refresh`, { refreshToken }, { authScope: "platform" });

    return { accessToken: response.data.access_token };
  },

  getProfile: async (): Promise<PlatformUserJSON> => {
    const response = await apiClient.get<ApiSingleResponse<ApiPlatformUser>>(
      `${BASE}/auth/profile`,
      { authScope: "platform" },
    );
    return mapPlatformUser(response.data);
  },

  getMetrics: async (): Promise<PlatformMetrics> => {
    const response = await apiClient.get<ApiSingleResponse<ApiPlatformMetrics>>(
      `${BASE}/metrics`,
      { authScope: "platform" },
    );
    return mapPlatformMetrics(response.data);
  },

  listPlans: async (): Promise<PlatformBillingPlan[]> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiPlatformBillingPlan[]>
    >(`${BASE}/plans`, { authScope: "platform" });
    return response.data.map(mapPlatformBillingPlan);
  },

  listTenants: async (
    params?: PlatformTenantsQueryParams,
  ): Promise<MappedPaginatedResult<PlatformTenantListItem>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
    if (params?.status) queryParams.status = params.status;
    if (params?.planCode) queryParams.plan_code = params.planCode;
    if (params?.search) queryParams.search = params.search;

    const response = await apiClient.get<
      ApiPaginatedResponse<ApiPlatformTenantListItem>
    >(`${BASE}/tenants`, {
      params: queryParams,
      authScope: "platform",
    });

    return {
      data: response.data.map(mapPlatformTenantListItem),
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      },
    };
  },

  getTenantById: async (
    id: string,
  ): Promise<MappedSingleResult<PlatformTenantDetail>> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiPlatformTenantListItem>
    >(`${BASE}/tenants/${id}`, { authScope: "platform" });
    return {
      data: mapPlatformTenantDetail(response.data),
      message: response.message,
    };
  },

  createTenant: async (
    payload: CreatePlatformTenantPayload,
  ): Promise<MappedSingleResult<{ tenant: PlatformTenantListItem }>> => {
    const response = await apiClient.post<
      ApiSingleResponse<{ tenant: ApiPlatformTenantListItem }>
    >(`${BASE}/tenants`, toApiCreatePlatformTenant(payload), {
      authScope: "platform",
    });
    return {
      data: { tenant: mapPlatformTenantListItem(response.data.tenant) },
      message: response.message,
    };
  },

  updateTenantStatus: async (
    id: string,
    payload: UpdatePlatformTenantStatusPayload,
  ): Promise<MappedSingleResult<PlatformTenantListItem>> => {
    const response = await apiClient.patch<
      ApiSingleResponse<ApiPlatformTenantListItem>
    >(
      `${BASE}/tenants/${id}/status`,
      toApiUpdatePlatformTenantStatus(payload),
      { authScope: "platform" },
    );
    return {
      data: mapPlatformTenantListItem(response.data),
      message: response.message,
    };
  },

  updateDeclaredFleet: async (
    id: string,
    payload: UpdateDeclaredFleetPayload,
  ): Promise<
    MappedSingleResult<{
      id: string;
      declaredFleetBand: string | null;
      declaredFleetUnits: number | null;
      planCode: string | null;
    }>
  > => {
    const response = await apiClient.patch<
      ApiSingleResponse<{
        id: string;
        declared_fleet_band: string | null;
        declared_fleet_units: number | null;
        plan_code: string | null;
      }>
    >(`${BASE}/tenants/${id}/declared-fleet`, toApiUpdateDeclaredFleet(payload), {
      authScope: "platform",
    });
    return {
      data: {
        id: response.data.id,
        declaredFleetBand: response.data.declared_fleet_band,
        declaredFleetUnits: response.data.declared_fleet_units,
        planCode: response.data.plan_code,
      },
      message: response.message,
    };
  },

  listAuditLog: async (
    params?: PlatformAuditLogQueryParams,
  ): Promise<MappedPaginatedResult<PlatformAuditLogItem>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
    if (params?.action) queryParams.action = params.action;
    if (params?.targetTenantId) {
      queryParams.target_tenant_id = params.targetTenantId;
    }
    if (params?.createdFrom) queryParams.created_from = params.createdFrom;
    if (params?.createdTo) queryParams.created_to = params.createdTo;

    const response = await apiClient.get<
      ApiPaginatedResponse<ApiPlatformAuditLogItem>
    >(`${BASE}/audit-log`, {
      params: queryParams,
      authScope: "platform",
    });

    return {
      data: response.data.map(mapPlatformAuditLogItem),
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      },
    };
  },

  getTenantSubscription: async (
    tenantId: string,
  ): Promise<PlatformTenantSubscription> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingSubscription>>(
      `${BASE}/tenants/${tenantId}/subscription`,
      { authScope: "platform" },
    );
    return mapPlatformTenantSubscription(response.data);
  },

  upsertTenantSubscription: async (
    tenantId: string,
    payload: UpsertPlatformTenantSubscriptionPayload,
  ): Promise<PlatformTenantSubscription> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBillingSubscription>>(
      `${BASE}/tenants/${tenantId}/subscription`,
      {
        plan_code: payload.planCode,
        status: payload.status,
        billing_cycle: payload.billingCycle,
        trial_ends_at: payload.trialEndsAt,
        notes: payload.notes,
      },
      { authScope: "platform" },
    );
    return mapPlatformTenantSubscription(response.data);
  },

  getTenantStampUsage: async (
    tenantId: string,
  ): Promise<PlatformTenantStampUsage> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingUsage>>(
      `${BASE}/tenants/${tenantId}/usage`,
      { authScope: "platform" },
    );
    return mapPlatformTenantStampUsage(response.data);
  },

  getTenantEntitlements: async (
    tenantId: string,
  ): Promise<PlatformTenantEntitlements> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBillingEntitlements>>(
      `${BASE}/tenants/${tenantId}/entitlements`,
      { authScope: "platform" },
    );
    return mapPlatformTenantEntitlements(response.data);
  },

  mutateTenantEntitlement: async (
    tenantId: string,
    payload: MutatePlatformEntitlementPayload,
  ): Promise<PlatformTenantEntitlements> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBillingEntitlements>>(
      `${BASE}/tenants/${tenantId}/entitlements`,
      {
        module_code: payload.moduleCode,
        action: payload.action === "activate" ? "activate" : "deactivate",
      },
      { authScope: "platform" },
    );
    return mapPlatformTenantEntitlements(response.data);
  },

  listModules: async (): Promise<PlatformModuleCatalogItem[]> => {
    const response = await apiClient.get<
      ApiSingleResponse<
        Array<{
          code: string;
          name: string;
          kind: string;
          price_ea_cents: number | null;
          price_ga_cents: number | null;
          member_codes: string[];
        }>
      >
    >(`${BASE}/modules`, { authScope: "platform" });
    return response.data.map(mapPlatformModuleCatalogItem);
  },

  listStampPackCatalog: async (): Promise<PlatformStampPackCatalogItem[]> => {
    const response = await apiClient.get<
      ApiSingleResponse<
        Array<{
          code: string;
          name: string;
          stamps: number;
          price_cents: number;
          is_active: boolean;
          sort_order: number;
        }>
      >
    >(`${BASE}/stamp-packs`, { authScope: "platform" });
    return response.data.map(mapPlatformStampPackCatalogItem);
  },

  getTenantStampPacks: async (
    tenantId: string,
  ): Promise<PlatformTenantStampPackBalance> => {
    const response = await apiClient.get<
      ApiSingleResponse<{
        prepaid_remaining: number;
        prepaid_purchased: number;
        prepaid_consumed: number;
        packs: Array<{
          id: string;
          tenant_id: string;
          catalog_code: string;
          stamps_purchased: number;
          stamps_remaining: number;
          price_cents: number;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
        }>;
      }>
    >(`${BASE}/tenants/${tenantId}/stamp-packs`, { authScope: "platform" });
    return mapPlatformTenantStampPackBalance(response.data);
  },

  grantTenantStampPack: async (
    tenantId: string,
    payload: GrantPlatformStampPackPayload,
  ): Promise<PlatformTenantStampPackBalance> => {
    const response = await apiClient.post<
      ApiSingleResponse<{
        prepaid_remaining: number;
        prepaid_purchased: number;
        prepaid_consumed: number;
        packs: Array<{
          id: string;
          tenant_id: string;
          catalog_code: string;
          stamps_purchased: number;
          stamps_remaining: number;
          price_cents: number;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
        }>;
      }>
    >(
      `${BASE}/tenants/${tenantId}/stamp-packs`,
      {
        catalog_code: payload.catalogCode,
        notes: payload.notes ?? null,
      },
      { authScope: "platform" },
    );
    return mapPlatformTenantStampPackBalance(response.data);
  },

  downloadTenantReconciliationCsv: async (
    tenantId: string,
    periodKey?: string,
  ): Promise<void> => {
    const params = new URLSearchParams({
      format: "csv",
      tenant_id: tenantId,
    });
    if (periodKey) {
      params.set("period_key", periodKey);
    }
    const filename = `billing-reconciliation-${tenantId.slice(0, 8)}${periodKey ? `-${periodKey}` : ""}.csv`;
    await apiClient.downloadFile(
      `${BASE}/billing/reconciliation?${params.toString()}`,
      filename,
      { authScope: "platform" },
    );
  },
};
