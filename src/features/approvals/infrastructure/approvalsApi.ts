import { apiClient } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import {
  queueListFilters,
  type ApprovableItem,
  type ApprovableType,
  type ApprovalGuards,
  type ApprovalQueue,
  type BulkOperation,
  type ListApprovalsFilters,
  type ReturnApprovableInput,
  type SelfApprovalPolicy,
} from "../domain";
import {
  mapApprovalDecisionResponse,
  mapApprovalHistory,
  mapBulkResultResponse,
  mapListApprovalsResponse,
  mapSelfApprovalPolicy,
  type ApiApprovalDecisionRaw,
  type ApiApprovalHistoryEntryRaw,
  type ApiApprovableItemRaw,
  type ApiBulkResultRaw,
  type ApiListApprovalsPaginationRaw,
  type ApiSelfApprovalPolicyRaw,
} from "./mappers";

const APPROVALS_ENDPOINT = "/finance/approvals";

function buildListParams(filters: ListApprovalsFilters): Record<string, string> {
  const params: Record<string, string> = {
    type: filters.type,
    page: String(filters.page ?? 1),
    page_size: String(filters.pageSize ?? 25),
  };

  if (filters.status) params.status = filters.status;
  if (filters.category) params.category = filters.category;
  if (filters.tripId) params.trip_id = filters.tripId;
  if (filters.driverId) params.driver_id = filters.driverId;
  if (filters.vehicleId) params.vehicle_id = filters.vehicleId;
  if (filters.fromDate) params.from_date = filters.fromDate;
  if (filters.toDate) params.to_date = filters.toDate;
  if (filters.search) params.search = filters.search;
  if (filters.selfApproved !== undefined) {
    params.self_approved = String(filters.selfApproved);
  }
  if (filters.assignedToMe) params.assigned_to_me = "true";
  if (filters.includeReturned) params.include_returned = "true";

  return params;
}

/** Solo las guardas presentes; el cliente HTTP convierte a snake_case. */
function guardsBody(guards: ApprovalGuards | undefined): ApprovalGuards {
  const body: ApprovalGuards = {};
  if (guards?.expectedStep !== undefined) body.expectedStep = guards.expectedStep;
  if (guards?.expectedRevision) body.expectedRevision = guards.expectedRevision;
  return body;
}

export interface PendingCountsByType {
  trip_expense: number;
  driver_advance_request: number;
  internal_staff_compensation: number;
  total: number;
}

export const approvalsApi = {
  list: async (filters: ListApprovalsFilters) => {
    const response = await apiClient.get<{
      data: ApiApprovableItemRaw[];
      pagination: ApiListApprovalsPaginationRaw;
    }>(APPROVALS_ENDPOINT, { params: buildListParams(filters) });

    return mapListApprovalsResponse(response);
  },

  approve: async (type: ApprovableType, id: string, guards?: ApprovalGuards) => {
    const response = await apiClient.post<ApiSingleResponse<ApiApprovalDecisionRaw>>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/approve`,
      guardsBody(guards),
    );
    return mapApprovalDecisionResponse(response);
  },

  reject: async (
    type: ApprovableType,
    id: string,
    reason: string,
    guards?: ApprovalGuards,
  ) => {
    const response = await apiClient.post<ApiSingleResponse<ApiApprovalDecisionRaw>>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/reject`,
      { reason, ...guardsBody(guards) },
    );
    return mapApprovalDecisionResponse(response);
  },

  returnForCorrection: async (
    type: ApprovableType,
    id: string,
    input: ReturnApprovableInput,
  ) => {
    const response = await apiClient.post<ApiSingleResponse<ApiApprovalDecisionRaw>>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/return`,
      { reason: input.reason, reasonCode: input.reasonCode, ...guardsBody(input) },
    );
    return mapApprovalDecisionResponse(response);
  },

  history: async (type: ApprovableType, id: string) => {
    const response = await apiClient.get<{ data: ApiApprovalHistoryEntryRaw[] }>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/history`,
    );
    return mapApprovalHistory(response.data ?? []);
  },

  bulk: async (operations: BulkOperation[]) => {
    const response = await apiClient.post<{
      data: ApiBulkResultRaw;
      message: string;
    }>(`${APPROVALS_ENDPOINT}/bulk`, { operations });

    return {
      data: mapBulkResultResponse(response.data),
      message: response.message,
    };
  },

  getSelfApprovalPolicy: async (): Promise<SelfApprovalPolicy> => {
    const response = await apiClient.get<
      ApiSingleResponse<ApiSelfApprovalPolicyRaw>
    >(`${APPROVALS_ENDPOINT}/self-approval-policy`);
    return mapSelfApprovalPolicy(response.data);
  },

  /** CEO-3: sin cola explícita cuenta «Me toca». */
  getPendingCount: async (
    type?: ApprovableType,
    queue: ApprovalQueue = "mine",
  ): Promise<number> => {
    if (!type) {
      const allCounts = await approvalsApi.getAllPendingCounts(queue);
      return allCounts.total;
    }

    const result = await approvalsApi.list({
      type,
      status: "pending",
      ...queueListFilters(queue),
      page: 1,
      pageSize: 1,
    });
    return result.pagination.total;
  },

  getAllPendingCounts: async (
    queue: ApprovalQueue = "mine",
  ): Promise<PendingCountsByType> => {
    const [expenses, advances, settlements] = await Promise.all([
      approvalsApi.getPendingCount("trip_expense", queue).catch(() => 0),
      approvalsApi.getPendingCount("driver_advance_request", queue).catch(() => 0),
      approvalsApi.getPendingCount("internal_staff_compensation", queue).catch(() => 0),
    ]);

    return {
      trip_expense: expenses,
      driver_advance_request: advances,
      internal_staff_compensation: settlements,
      total: expenses + advances + settlements,
    };
  },
};

export type { ApprovableItem };
