import { apiClient } from "@shared/api";
import type { ApiSingleResponse, MappedPaginatedResult } from "@shared/api";
import type {
  ApprovalDecisionOutcome,
  ApprovalGuards,
  ApprovalReturnReasonCode,
} from "@features/approvals";
import type {
  CompensationAgreement,
  DriverAdvance,
  DriverSettlement,
  SettlementPreview,
  SettlementWorkbenchData,
  TenantSettlementSettings,
  UpdateDriverAdvanceResult,
  UpdateSettlementResult,
} from "../domain/entities";
import type { AdvanceStatus, SettlementStatus } from "../domain/enums";
import type { ManualSettlementItemInput } from "../domain/settlementTotals";
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

function toGuardsBody(guards?: ApprovalGuards): Record<string, string | number> {
  const body: Record<string, string | number> = {};
  if (guards?.expectedStep !== undefined) body.expected_step = guards.expectedStep;
  if (guards?.expectedRevision) body.expected_revision = guards.expectedRevision;
  return body;
}

export interface ApproveAdvanceResult {
  advance: DriverAdvance;
  outcome?: Extract<ApprovalDecisionOutcome, "approved" | "step_signed">;
}

export interface UpdateDriverAdvancePayload {
  /** Solo en borrador (D17). */
  employeeId?: string;
  amount?: number;
  category?: string;
  paymentMethod?: string;
  tripId?: string | null;
  bankReference?: string | null;
  notes?: string | null;
  expectedStatus: AdvanceStatus;
}

export interface ApproveSettlementResult {
  settlement: DriverSettlement;
  outcome?: Extract<ApprovalDecisionOutcome, "approved" | "step_signed">;
}

/** ADR-0085 E10: cada lista reemplaza su conjunto; `expected_status` es la guarda. */
export interface UpdateSettlementPayload {
  notes?: string | null;
  customItems?: ManualSettlementItemInput[];
  /** Solo en borrador sin anticipos reservados. */
  advancesToApply?: { advanceId: string; amountToDeduct: number }[];
  expectedStatus: SettlementStatus;
}

/** Cuerpo estricto del API: `is_deduction` solo cuando el tipo no lo deriva. */
function toManualItemBody(item: ManualSettlementItemInput) {
  return {
    item_type: item.itemType,
    description: item.description.trim(),
    amount: item.amount,
    ...(item.itemType === "adjustment" ? { is_deduction: item.isDeduction === true } : {}),
    ...(item.tripId ? { trip_id: item.tripId } : {}),
  };
}

/** ADR-0085 E11 punto 9: «Pago de reembolsos» — sin viajes ni período (lo fija el servidor). */
export interface CreateReimbursementSettlementPayload {
  employeeId: string;
  confirmedReimbursementExpenseIds: string[];
  advancesToApply: { advanceId: string; amountToDeduct: number }[];
  customItems: ManualSettlementItemInput[];
  notes?: string;
  submitForApproval: boolean;
}

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

  approveAdvance: async (
    id: string,
    guards?: ApprovalGuards,
  ): Promise<ApproveAdvanceResult> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiDriverAdvanceRaw & { approval_outcome?: string | null }>
    >(`${BASE_ENDPOINT}/advances/${id}/approve`, toGuardsBody(guards));
    const outcome = response.data.approval_outcome;
    return {
      advance: mapAdvance(response.data),
      outcome:
        outcome === "approved" || outcome === "step_signed" ? outcome : undefined,
    };
  },

  rejectAdvance: async (
    id: string,
    reason: string,
    guards?: ApprovalGuards,
  ): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/reject`,
      { reason, ...toGuardsBody(guards) },
    );
    return mapAdvance(response.data);
  },

  returnAdvance: async (
    id: string,
    input: { reason: string; reasonCode: ApprovalReturnReasonCode; guards?: ApprovalGuards },
  ): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/return`,
      { reason: input.reason, reason_code: input.reasonCode, ...toGuardsBody(input.guards) },
    );
    return mapAdvance(response.data);
  },

  /** ADR-0099 D17: `expected_status` es la guarda; el API decide el efecto en la autorización. */
  updateAdvance: async (
    id: string,
    payload: UpdateDriverAdvancePayload,
  ): Promise<UpdateDriverAdvanceResult> => {
    const response = await apiClient.patch<{
      data: ApiDriverAdvanceRaw;
      message?: string;
      meta?: { approval_effect?: string; changes?: string[] };
    }>(`${BASE_ENDPOINT}/advances/${id}`, {
      ...(payload.employeeId !== undefined ? { employee_id: payload.employeeId } : {}),
      ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.paymentMethod !== undefined ? { payment_method: payload.paymentMethod } : {}),
      ...(payload.tripId !== undefined ? { trip_id: payload.tripId } : {}),
      ...(payload.bankReference !== undefined ? { bank_reference: payload.bankReference } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      expected_status: payload.expectedStatus,
    });
    const effect = response.meta?.approval_effect;
    return {
      advance: mapAdvance(response.data),
      approvalEffect:
        effect === "flow_restarted" || effect === "reapproval_required" ? effect : "none",
      changes: response.meta?.changes ?? [],
    };
  },

  cancelAdvance: async (id: string, reason?: string): Promise<DriverAdvance> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverAdvanceRaw>>(
      `${BASE_ENDPOINT}/advances/${id}/cancel`,
      reason ? { reason } : {},
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

  previewReimbursementSettlement: async (employeeId: string): Promise<SettlementPreview> => {
    const response = await apiClient.get<ApiSingleResponse<ApiSettlementPreviewRaw>>(
      `${BASE_ENDPOINT}/preview`,
      { params: { employee_id: employeeId, settlement_kind: "reimbursement_only" } },
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
      customItems: (payload.customItems ?? []).map(toManualItemBody),
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      BASE_ENDPOINT,
      cleanedPayload,
    );
    return mapSettlement(response.data);
  },

  createReimbursementSettlement: async (
    payload: CreateReimbursementSettlementPayload,
  ): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      BASE_ENDPOINT,
      {
        settlementKind: "reimbursement_only",
        employeeId: payload.employeeId,
        confirmedReimbursementExpenseIds: payload.confirmedReimbursementExpenseIds,
        advancesToApply: payload.advancesToApply,
        customItems: payload.customItems.map(toManualItemBody),
        notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
        submitForApproval: payload.submitForApproval,
      },
    );
    return mapSettlement(response.data);
  },

  /** ADR-0085 E10: corregir partidas manuales, anticipos (borrador) y notas. */
  updateSettlement: async (
    id: string,
    payload: UpdateSettlementPayload,
  ): Promise<UpdateSettlementResult> => {
    const response = await apiClient.patch<{
      data: ApiDriverSettlementRaw;
      message?: string;
      meta?: { approval_effect?: string; changes?: string[] };
    }>(`${BASE_ENDPOINT}/${id}`, {
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.customItems !== undefined
        ? { custom_items: payload.customItems.map(toManualItemBody) }
        : {}),
      ...(payload.advancesToApply !== undefined
        ? {
            advances_to_apply: payload.advancesToApply.map((advance) => ({
              advance_id: advance.advanceId,
              amount_to_deduct: advance.amountToDeduct,
            })),
          }
        : {}),
      expected_status: payload.expectedStatus,
    });
    const effect = response.meta?.approval_effect;
    return {
      settlement: mapSettlement(response.data),
      approvalEffect:
        effect === "flow_restarted" || effect === "reapproval_required" ? effect : "none",
      changes: response.meta?.changes ?? [],
    };
  },

  /**
   * Enviar borrador/devuelta a autorización.
   * Body opcional H-2: ack de viajes con `calculation_gap` post-mínimo (defaults false).
   */
  submitSettlement: async (
    id: string,
    ack?: {
      acknowledgeZeroKmTrips?: boolean;
      acknowledgeZeroFreightTrips?: boolean;
    },
  ): Promise<DriverSettlement> => {
    const body =
      ack &&
      (ack.acknowledgeZeroKmTrips !== undefined ||
        ack.acknowledgeZeroFreightTrips !== undefined)
        ? {
            acknowledgeZeroKmTrips: ack.acknowledgeZeroKmTrips ?? false,
            acknowledgeZeroFreightTrips: ack.acknowledgeZeroFreightTrips ?? false,
          }
        : undefined;
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/submit`,
      body,
    );
    return mapSettlement(response.data);
  },

  approveSettlement: async (
    id: string,
    guards?: ApprovalGuards,
  ): Promise<ApproveSettlementResult> => {
    const response = await apiClient.post<
      ApiSingleResponse<ApiDriverSettlementRaw & { approval_outcome?: string | null }>
    >(`${BASE_ENDPOINT}/${id}/approve`, guards ? toGuardsBody(guards) : undefined);
    const outcome = response.data.approval_outcome;
    return {
      settlement: mapSettlement(response.data),
      outcome:
        outcome === "approved" || outcome === "step_signed" ? outcome : undefined,
    };
  },

  rejectSettlement: async (
    id: string,
    reason: string,
    guards?: ApprovalGuards,
  ): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/reject`,
      { reason, ...toGuardsBody(guards) },
    );
    return mapSettlement(response.data);
  },

  returnSettlement: async (
    id: string,
    input: { reason: string; reasonCode: ApprovalReturnReasonCode; guards?: ApprovalGuards },
  ): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/return`,
      { reason: input.reason, reason_code: input.reasonCode, ...toGuardsBody(input.guards) },
    );
    return mapSettlement(response.data);
  },

  cancelSettlement: async (
    id: string,
    input: { reason?: string; expectedStatus?: SettlementStatus } = {},
  ): Promise<DriverSettlement> => {
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/cancel`,
      {
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.expectedStatus ? { expected_status: input.expectedStatus } : {}),
      },
    );
    return mapSettlement(response.data);
  },

  disburseSettlement: async (
    id: string,
    payload: DisburseSettlementFormData,
    expectedRevision: string,
  ): Promise<DriverSettlement> => {
    const cleanedPayload = {
      ...payload,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
      expected_revision: expectedRevision,
    };
    const response = await apiClient.post<ApiSingleResponse<ApiDriverSettlementRaw>>(
      `${BASE_ENDPOINT}/${id}/disburse`,
      cleanedPayload,
    );
    return mapSettlement(response.data);
  },
};
