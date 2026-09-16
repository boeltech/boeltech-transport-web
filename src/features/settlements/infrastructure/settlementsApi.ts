import { apiClient } from "@shared/api";
import type { ApiSingleResponse, MappedPaginatedResult } from "@shared/api";
import type {
  CompensationAgreement,
  DriverAdvance,
  DriverSettlement,
  SettlementPreview,
  SettlementWorkbenchData,
  TenantSettlementSettings,
} from "../domain/entities";
import {
  mapAgreement,
  mapAdvance,
  mapSettlement,
  mapSettlementPreview,
  mapListAdvancesResponse,
  mapListSettlementsResponse,
  mapWorkbenchResponse,
  mapSettlementSettings,
  type ApiCompensationAgreementRaw,
  type ApiDriverAdvanceRaw,
  type ApiDriverSettlementRaw,
  type ApiPaginationRaw,
  type ApiSettlementPreviewRaw,
  type ApiTenantSettlementSettingsRaw,
} from "./mappers";
import type {
  CompensationAgreementFormData,
  DriverAdvanceFormData,
  CreateSettlementFormData,
  DisburseSettlementFormData,
  PreviewSettlementQueryParams,
} from "../presentation/validation/settlementSchemas";

const BASE_ENDPOINT = "/settlements";

export interface ListSettlementsParams {
  employeeId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdvancesParams {
  employeeId?: string;
  tripId?: string;
  status?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListWorkbenchParams {
  employeeId?: string;
  branchId?: string;
  includeContractors?: boolean;
}

export const settlementsApi = {
  getSettings: async (): Promise<TenantSettlementSettings> => {
    const response = await apiClient.get<ApiSingleResponse<ApiTenantSettlementSettingsRaw>>(
      `${BASE_ENDPOINT}/settings`,
    );
    return mapSettlementSettings(response.data);
  },

  updateSettings: async (payload: {
    voboThresholdMxn?: number;
    pagosOperadoresGreenfieldV1?: boolean;
  }): Promise<TenantSettlementSettings> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiTenantSettlementSettingsRaw>>(
      `${BASE_ENDPOINT}/settings`,
      payload,
    );
    return mapSettlementSettings(response.data);
  },

  // ==========================================================================
  // AGREEMENTS
  // ==========================================================================
  listAgreements: async (employeeId?: string): Promise<CompensationAgreement[]> => {
    const params = employeeId ? { employee_id: employeeId } : undefined;
    const response = await apiClient.get<{ data: ApiCompensationAgreementRaw[] }>(
      `${BASE_ENDPOINT}/agreements`,
      { params },
    );
    return response.data.map(mapAgreement);
  },

  createAgreement: async (
    payload: CompensationAgreementFormData,
  ): Promise<CompensationAgreement> => {
    const cleanedPayload = {
      ...payload,
      effectiveTo: payload.effectiveTo?.trim() ? payload.effectiveTo.trim() : undefined,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiCompensationAgreementRaw>>(
      `${BASE_ENDPOINT}/agreements`,
      cleanedPayload,
    );
    return mapAgreement(response.data);
  },

  updateAgreement: async (
    id: string,
    payload: { isActive?: boolean; effectiveTo?: string },
  ): Promise<CompensationAgreement> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiCompensationAgreementRaw>>(
      `${BASE_ENDPOINT}/agreements/${id}`,
      payload,
    );
    return mapAgreement(response.data);
  },

  deleteAgreement: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_ENDPOINT}/agreements/${id}`);
  },

  // ==========================================================================
  // ADVANCES
  // ==========================================================================
  listAdvances: async (
    params: ListAdvancesParams,
  ): Promise<MappedPaginatedResult<DriverAdvance>> => {
    const queryParams: Record<string, string> = {
      page: String(params.page ?? 1),
      page_size: String(params.pageSize ?? 25),
    };
    if (params.employeeId) queryParams.employee_id = params.employeeId;
    if (params.tripId) queryParams.trip_id = params.tripId;
    if (params.status) queryParams.status = params.status;
    if (params.category) queryParams.category = params.category;
    if (params.fromDate) queryParams.from_date = params.fromDate;
    if (params.toDate) queryParams.to_date = params.toDate;
    if (params.search) queryParams.search = params.search;

    const response = await apiClient.get<{
      data: ApiDriverAdvanceRaw[];
      pagination: ApiPaginationRaw;
    }>(`${BASE_ENDPOINT}/advances`, { params: queryParams });

    return mapListAdvancesResponse(response);
  },

  getAdvanceById: async (id: string): Promise<DriverAdvance> => {
    const response = await apiClient.get<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}`,
    );
    return mapAdvance(response.data);
  },

  createAdvance: async (payload: DriverAdvanceFormData): Promise<DriverAdvance> => {
    const cleanedPayload = {
      ...payload,
      tripId: payload.tripId?.trim() ? payload.tripId.trim() : undefined,
      bankReference: payload.bankReference?.trim() ? payload.bankReference.trim() : undefined,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances`,
      cleanedPayload,
    );
    return mapAdvance(response.data);
  },

  submitAdvance: async (id: string): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/submit`,
    );
    return mapAdvance(response.data);
  },

  approveAdvance: async (id: string): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/approve`,
    );
    return mapAdvance(response.data);
  },

  rejectAdvance: async (id: string, reason: string): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/reject`,
      { reason },
    );
    return mapAdvance(response.data);
  },

  disburseAdvance: async (
    id: string,
    payload: { paymentMethod?: string; bankReference?: string; disbursedAt?: string },
  ): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/disburse`,
      payload,
    );
    return mapAdvance(response.data);
  },

  // ==========================================================================
  // SETTLEMENTS & PREVIEW
  // ==========================================================================
  getWorkbench: async (
    params: ListWorkbenchParams = {},
  ): Promise<SettlementWorkbenchData> => {
    const queryParams: Record<string, string> = {};
    if (params.employeeId) queryParams.employee_id = params.employeeId;
    if (params.branchId) queryParams.branch_id = params.branchId;
    if (params.includeContractors) {
      queryParams.include_contractors = "true";
    }

    const response = await apiClient.get<{ data: unknown }>(
      `${BASE_ENDPOINT}/workbench`,
      { params: queryParams },
    );
    return mapWorkbenchResponse(response.data);
  },

  previewSettlement: async (
    params: PreviewSettlementQueryParams,
  ): Promise<SettlementPreview> => {
    const queryParams: Record<string, string> = {
      employee_id: params.employeeId,
      period_start: params.periodStart,
      period_end: params.periodEnd,
    };
    if (params.tripIds && params.tripIds.length > 0) {
      queryParams.trip_ids = params.tripIds.join(",");
    }

    const response = await apiClient.get<ApiSingleResponse<ApiSettlementPreviewRaw>>(
      `${BASE_ENDPOINT}/preview`,
      { params: queryParams },
    );
    return mapSettlementPreview(response.data);
  },

  listSettlements: async (
    params: ListSettlementsParams,
  ): Promise<MappedPaginatedResult<DriverSettlement>> => {
    const queryParams: Record<string, string> = {
      page: String(params.page ?? 1),
      page_size: String(params.pageSize ?? 25),
    };
    if (params.employeeId) queryParams.employee_id = params.employeeId;
    if (params.status) queryParams.status = params.status;
    if (params.fromDate) queryParams.from_date = params.fromDate;
    if (params.toDate) queryParams.to_date = params.toDate;
    if (params.search) queryParams.search = params.search;

    const response = await apiClient.get<{
      data: ApiDriverSettlementRaw[];
      pagination: ApiPaginationRaw;
    }>(BASE_ENDPOINT, { params: queryParams });

    return mapListSettlementsResponse(response);
  },

  getSettlementById: async (id: string): Promise<DriverSettlement> => {
    const response = await apiClient.get<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}`,
    );
    return mapSettlement(response.data);
  },

  createSettlement: async (
    payload: CreateSettlementFormData,
  ): Promise<DriverSettlement> => {
    const cleanedPayload = {
      ...payload,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      BASE_ENDPOINT,
      cleanedPayload,
    );
    return mapSettlement(response.data);
  },

  submitSettlement: async (id: string): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/submit`,
    );
    return mapSettlement(response.data);
  },

  approveSettlement: async (id: string): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/approve`,
    );
    return mapSettlement(response.data);
  },

  rejectSettlement: async (
    id: string,
    reason: string,
  ): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/reject`,
      { reason },
    );
    return mapSettlement(response.data);
  },

  cancelSettlement: async (id: string): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/cancel`,
    );
    return mapSettlement(response.data);
  },

  disburseSettlement: async (
    id: string,
    payload: DisburseSettlementFormData,
  ): Promise<DriverSettlement> => {
    const cleanedPayload = {
      ...payload,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/disburse`,
      cleanedPayload,
    );
    return mapSettlement(response.data);
  },
};
