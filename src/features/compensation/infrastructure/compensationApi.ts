import {
  apiClient,
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type Pagination,
} from "@shared/api";
import type {
  ActivateCompensationTemplatePayload,
  BatchAssignmentPreview,
  BatchAssignmentResult,
  BatchTemplateAssignmentPayload,
  CompensationTemplate,
  CompensationTemplateEvent,
  CreateCompensationTemplatePayload,
  CreateCorridorTariffPayload,
  FixedAllowanceOverride,
  FrequentCityPair,
  ReplaceTemplateConfigurationPayload,
  RouteCorridorTariff,
  TemplateAssignment,
  TemplateDeduction,
  UpdateCompensationTemplatePayload,
  UpdateTemplateAssignmentPayload,
  UpsertFixedAllowanceOverridePayload,
} from "../domain/entities";
import type { CompensationTemplateStatus } from "../domain/enums";
import {
  mapAssignmentFromApi,
  mapBatchPreviewFromApi,
  mapBatchResultFromApi,
  mapCorridorFromApi,
  mapFixedAllowanceOverrideFromApi,
  mapFrequentCityPairFromApi,
  mapTemplateEventFromApi,
  mapTemplateFromApi,
  type ApiBatchAssignmentPreviewCamel,
  type ApiBatchAssignmentResultCamel,
  type ApiCompensationTemplateCamel,
  type ApiCompensationTemplateEventCamel,
  type ApiFixedAllowanceOverrideCamel,
  type ApiFrequentCityPairCamel,
  type ApiRouteCorridorTariffCamel,
  type ApiRouteCorridorTariffRaw,
  type ApiTemplateAssignmentCamel,
} from "./mappers";

const BASE = "/compensation";

export interface ListTemplatesParams {
  search?: string;
  /** Preferir `status` (draft|active|inactive). */
  status?: CompensationTemplateStatus;
  /** Compat: active → status=active; inactive → status≠active. */
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
export interface ListCorridorsParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListFrequentCityPairsParams {
  limit?: number;
  q?: string;
}

export interface ListAssignmentsParams {
  templateId?: string;
  employeeId?: string;
  activeOn?: string;
  page?: number;
  pageSize?: number;
}

function mapDeductionToWire(deduction: TemplateDeduction) {
  return {
    deductionType: deduction.deductionType,
    label: deduction.label,
    amount: deduction.amount,
    period: deduction.period,
    isMandatory: deduction.isMandatory,
  };
}

function toTemplatePayload(payload: CreateCompensationTemplatePayload) {
  return {
    name: payload.name,
    description: payload.description ?? null,
    midTripPayoutPolicy: payload.midTripPayoutPolicy,
    rules: (payload.rules ?? []).map((rule) => ({
      routeType: rule.routeType,
      commissionType: rule.commissionType,
      rateValue: rule.rateValue,
      minimumGuaranteedAmount: rule.minimumGuaranteedAmount,
      notes: rule.notes ?? null,
      sortOrder: rule.sortOrder,
    })),
    fixedAllowances: (payload.fixedAllowances ?? []).map((allowance) => ({
      allowanceType: allowance.allowanceType,
      label: allowance.label,
      amount: allowance.amount,
      period: allowance.period,
      isMandatory: allowance.isMandatory,
    })),
    deductions: (payload.deductions ?? []).map(mapDeductionToWire),
    corridorIds: payload.corridorIds ?? [],
  };
}

export interface ListAllowanceOverridesParams {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
}

function toConfigurationPayload(payload: ReplaceTemplateConfigurationPayload) {
  return {
    rules: payload.rules.map((rule) => ({
      routeType: rule.routeType,
      commissionType: rule.commissionType,
      rateValue: rule.rateValue,
      minimumGuaranteedAmount: rule.minimumGuaranteedAmount,
      notes: rule.notes ?? null,
      sortOrder: rule.sortOrder,
    })),
    fixedAllowances: payload.fixedAllowances.map((allowance) => ({
      allowanceType: allowance.allowanceType,
      label: allowance.label,
      amount: allowance.amount,
      period: allowance.period,
      isMandatory: allowance.isMandatory,
    })),
    deductions: payload.deductions.map(mapDeductionToWire),
    corridorIds: payload.corridorIds,
  };
}

function toPatchTemplatePayload(payload: UpdateCompensationTemplatePayload) {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = payload.name;
  if (payload.description !== undefined) body.description = payload.description;
  // Status transitions: usar activate/deactivate. No enviar isActive desde el form.
  if (payload.midTripPayoutPolicy !== undefined) {
    body.midTripPayoutPolicy = payload.midTripPayoutPolicy;
  }

  if (payload.rules !== undefined) {
    body.rules = payload.rules.map((rule) => ({
      routeType: rule.routeType,
      commissionType: rule.commissionType,
      rateValue: rule.rateValue,
      minimumGuaranteedAmount: rule.minimumGuaranteedAmount,
      notes: rule.notes ?? null,
      sortOrder: rule.sortOrder,
    }));
  }

  if (payload.fixedAllowances !== undefined) {
    body.fixedAllowances = payload.fixedAllowances.map((allowance) => ({
      allowanceType: allowance.allowanceType,
      label: allowance.label,
      amount: allowance.amount,
      period: allowance.period,
      isMandatory: allowance.isMandatory,
    }));
  }

  if (payload.deductions !== undefined) {
    body.deductions = payload.deductions.map(mapDeductionToWire);
  }

  if (payload.corridorIds !== undefined) {
    body.corridorIds = payload.corridorIds;
  }

  return body;
}

/** El lote no quita ids repetidos (la vista previa sí): se mandan únicos y en orden. */
function toBatchAssignmentBody(payload: BatchTemplateAssignmentPayload) {
  return {
    templateId: payload.templateId,
    employeeIds: [...new Set(payload.employeeIds)],
    effectiveFrom: payload.effectiveFrom,
    effectiveTo: payload.effectiveTo ?? null,
    closePreviousAssignment: payload.closePreviousAssignment ?? true,
    reason: payload.reason ?? null,
  };
}

function toOverridePayload(payload: UpsertFixedAllowanceOverridePayload) {
  return {
    employeeId: payload.employeeId,
    allowanceId: payload.allowanceId,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
    isSuspended: payload.isSuspended,
  };
}

export const compensationApi = {
  listTemplates: async (
    params: ListTemplatesParams = {},
  ): Promise<{ data: CompensationTemplate[]; pagination: Pagination }> => {
    const response = await apiClient.get<ApiPaginatedResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates`,
      {
        params: {
          search: params.search,
          status: params.status,
          is_active: params.status ? undefined : params.isActive,
          page: params.page ?? 1,
          page_size: params.pageSize ?? 50,
        },
      },
    );
    const mapped = mapPaginatedResponse(response);
    return {
      data: mapped.data.map((row) => mapTemplateFromApi(row)),
      pagination: mapped.pagination,
    };
  },

  getTemplateById: async (id: string): Promise<CompensationTemplate> => {
    const response = await apiClient.get<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}`,
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  createTemplate: async (
    payload: CreateCompensationTemplatePayload,
  ): Promise<CompensationTemplate> => {
    const response = await apiClient.post<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates`,
      toTemplatePayload(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  updateTemplate: async (
    id: string,
    payload: UpdateCompensationTemplatePayload,
  ): Promise<CompensationTemplate> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}`,
      toPatchTemplatePayload(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  replaceTemplateConfiguration: async (
    id: string,
    payload: ReplaceTemplateConfigurationPayload,
  ): Promise<CompensationTemplate> => {
    const response = await apiClient.put<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}/configuration`,
      toConfigurationPayload(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/templates/${id}`);
  },

  activateTemplate: async (
    id: string,
    payload: ActivateCompensationTemplatePayload = {},
  ): Promise<CompensationTemplate> => {
    const response = await apiClient.post<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}/activate`,
      {
        deactivateSiblings: payload.deactivateSiblings ?? true,
      },
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  deactivateTemplate: async (id: string): Promise<CompensationTemplate> => {
    const response = await apiClient.post<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}/deactivate`,
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  createTemplateVersion: async (id: string): Promise<CompensationTemplate> => {
    const response = await apiClient.post<ApiSingleResponse<ApiCompensationTemplateCamel>>(
      `${BASE}/templates/${id}/versions`,
    );
    const { data } = mapSingleResponse(response);
    return mapTemplateFromApi(data);
  },

  listTemplateVersions: async (id: string): Promise<CompensationTemplate[]> => {
    const response = await apiClient.get<ApiSingleResponse<ApiCompensationTemplateCamel[]>>(
      `${BASE}/templates/${id}/versions`,
    );
    const { data } = mapSingleResponse(response);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => mapTemplateFromApi(row));
  },

  listTemplateActivity: async (
    id: string,
    params: { page?: number; pageSize?: number } = {},
  ): Promise<{ data: CompensationTemplateEvent[]; pagination: Pagination }> => {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiCompensationTemplateEventCamel>
    >(`${BASE}/templates/${id}/activity`, {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
      },
    });
    const mapped = mapPaginatedResponse(response);
    return {
      data: mapped.data.map((row) => mapTemplateEventFromApi(row)),
      pagination: mapped.pagination,
    };
  },

  listCorridors: async (
    params: ListCorridorsParams = {},
  ): Promise<{ data: RouteCorridorTariff[]; pagination: Pagination }> => {
    const response = await apiClient.get<ApiPaginatedResponse<ApiRouteCorridorTariffRaw>>(
      `${BASE}/corridors`,
      {
        params: {
          search: params.search,
          is_active: params.isActive,
          page: params.page ?? 1,
          page_size: params.pageSize ?? 50,
        },
      },
    );
    const mapped = mapPaginatedResponse(response);
    return {
      data: mapped.data.map((row) => mapCorridorFromApi(row)),
      pagination: mapped.pagination,
    };
  },

  getCorridorById: async (id: string): Promise<RouteCorridorTariff> => {
    const response = await apiClient.get<ApiSingleResponse<ApiRouteCorridorTariffCamel>>(
      `${BASE}/corridors/${id}`,
    );
    const { data } = mapSingleResponse(response);
    return mapCorridorFromApi(data);
  },

  createCorridor: async (payload: CreateCorridorTariffPayload): Promise<RouteCorridorTariff> => {
    const response = await apiClient.post<ApiSingleResponse<ApiRouteCorridorTariffCamel>>(
      `${BASE}/corridors`,
      {
        name: payload.name,
        originRefType: payload.originRefType,
        originRefValue: payload.originRefValue,
        destinationRefType: payload.destinationRefType,
        destinationRefValue: payload.destinationRefValue,
        fixedAmount: payload.fixedAmount,
        notes: payload.notes ?? null,
        isActive: payload.isActive ?? true,
      },
    );
    const { data } = mapSingleResponse(response);
    return mapCorridorFromApi(data);
  },

  updateCorridor: async (
    id: string,
    payload: Partial<CreateCorridorTariffPayload>,
  ): Promise<RouteCorridorTariff> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiRouteCorridorTariffCamel>>(
      `${BASE}/corridors/${id}`,
      payload,
    );
    const { data } = mapSingleResponse(response);
    return mapCorridorFromApi(data);
  },

  deleteCorridor: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/corridors/${id}`);
  },

  listFrequentCityPairs: async (
    params: ListFrequentCityPairsParams = {},
  ): Promise<FrequentCityPair[]> => {
    const response = await apiClient.get<ApiSingleResponse<ApiFrequentCityPairCamel[]>>(
      `${BASE}/frequent-city-pairs`,
      {
        params: {
          limit: params.limit ?? 20,
          q: params.q?.trim() || undefined,
        },
      },
    );
    const { data } = mapSingleResponse(response);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => mapFrequentCityPairFromApi(row));
  },

  listAssignments: async (
    params: ListAssignmentsParams = {},
  ): Promise<{ data: TemplateAssignment[]; pagination: Pagination }> => {
    const response = await apiClient.get<ApiPaginatedResponse<ApiTemplateAssignmentCamel>>(
      `${BASE}/template-assignments`,
      {
        params: {
          template_id: params.templateId,
          employee_id: params.employeeId,
          active_on: params.activeOn,
          page: params.page ?? 1,
          page_size: params.pageSize ?? 50,
        },
      },
    );
    const mapped = mapPaginatedResponse(response);
    return {
      data: mapped.data.map((row) => mapAssignmentFromApi(row)),
      pagination: mapped.pagination,
    };
  },

  batchCreateAssignments: async (
    payload: BatchTemplateAssignmentPayload,
  ): Promise<BatchAssignmentResult> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBatchAssignmentResultCamel>>(
      `${BASE}/template-assignments/batch`,
      toBatchAssignmentBody(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapBatchResultFromApi(data);
  },

  /** Misma regla que el lote, sin escribir (api#63). */
  previewBatchAssignments: async (
    payload: BatchTemplateAssignmentPayload,
  ): Promise<BatchAssignmentPreview> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBatchAssignmentPreviewCamel>>(
      `${BASE}/template-assignments/batch/preview`,
      toBatchAssignmentBody(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapBatchPreviewFromApi(data);
  },

  getAssignment: async (id: string): Promise<TemplateAssignment> => {
    const response = await apiClient.get<ApiSingleResponse<ApiTemplateAssignmentCamel>>(
      `${BASE}/template-assignments/${id}`,
    );
    const { data } = mapSingleResponse(response);
    return mapAssignmentFromApi(data);
  },

  deleteAssignment: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/template-assignments/${id}`);
  },

  updateAssignment: async (
    id: string,
    payload: UpdateTemplateAssignmentPayload,
  ): Promise<TemplateAssignment> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiTemplateAssignmentCamel>>(
      `${BASE}/template-assignments/${id}`,
      payload,
    );
    const { data } = mapSingleResponse(response);
    return mapAssignmentFromApi(data);
  },

  listFixedAllowanceOverrides: async (
    params: ListAllowanceOverridesParams,
  ): Promise<FixedAllowanceOverride[]> => {
    const response = await apiClient.get<ApiSingleResponse<ApiFixedAllowanceOverrideCamel[]>>(
      `${BASE}/fixed-allowance-overrides`,
      {
        params: {
          employee_id: params.employeeId,
          period_start: params.periodStart,
          period_end: params.periodEnd,
        },
      },
    );
    const { data } = mapSingleResponse(response);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => mapFixedAllowanceOverrideFromApi(row));
  },

  upsertFixedAllowanceOverride: async (
    payload: UpsertFixedAllowanceOverridePayload,
  ): Promise<FixedAllowanceOverride> => {
    const response = await apiClient.put<ApiSingleResponse<ApiFixedAllowanceOverrideCamel>>(
      `${BASE}/fixed-allowance-overrides`,
      toOverridePayload(payload),
    );
    const { data } = mapSingleResponse(response);
    return mapFixedAllowanceOverrideFromApi(data);
  },
};
