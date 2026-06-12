import { apiClient } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  ApprovableItem,
  ApprovableType,
  BulkOperation,
  ListApprovalsFilters,
} from "../domain";
import {
  mapBulkResultResponse,
  mapListApprovalsResponse,
  mapSingleApprovableResponse,
  type ApiApprovableItemRaw,
  type ApiListApprovalsPaginationRaw,
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

  return params;
}

export const approvalsApi = {
  list: async (filters: ListApprovalsFilters) => {
    const response = await apiClient.get<{
      data: ApiApprovableItemRaw[];
      pagination: ApiListApprovalsPaginationRaw;
    }>(APPROVALS_ENDPOINT, { params: buildListParams(filters) });

    return mapListApprovalsResponse(response);
  },

  approve: async (type: ApprovableType, id: string) => {
    const response = await apiClient.post<ApiSingleResponse<ApiApprovableItemRaw>>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/approve`,
    );
    return mapSingleApprovableResponse(response);
  },

  reject: async (type: ApprovableType, id: string, reason: string) => {
    const response = await apiClient.post<ApiSingleResponse<ApiApprovableItemRaw>>(
      `${APPROVALS_ENDPOINT}/${type}/${id}/reject`,
      { reason },
    );
    return mapSingleApprovableResponse(response);
  },

  bulk: async (operations: BulkOperation[]) => {
    const response = await apiClient.post<{
      data: {
        successes: Array<{
          type: string;
          id: string;
          item: ApiApprovableItemRaw;
        }>;
        failures: Array<{
          type: string;
          id: string;
          error: { code: string; message: string };
        }>;
      };
      message: string;
    }>(`${APPROVALS_ENDPOINT}/bulk`, { operations });

    return {
      data: mapBulkResultResponse(response.data),
      message: response.message,
    };
  },

  getPendingCount: async (): Promise<number> => {
    const result = await approvalsApi.list({
      type: "trip_expense",
      status: "pending",
      page: 1,
      pageSize: 1,
    });
    return result.pagination.total;
  },
};

export type { ApprovableItem };
