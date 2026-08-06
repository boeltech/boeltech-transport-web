import {
  apiClient,
  mapActionResponse,
  type ApiActionResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import type {
  Branch,
  BranchEmployeeReassignment,
  BranchListMeta,
  BranchManagementEvent,
  BranchQueryParams,
  BranchReconcilePreview,
} from "../domain/entities";
import type { CreateBranchDTO, UpdateBranchDTO } from "../domain/repository";
import {
  mapBranchCapacityMeta,
  mapBranchReconcilePreview,
  mapPaginatedBranches,
  mapPaginatedBranchActivity,
  mapSingleBranch,
  toApiCreateBranch,
  toApiUpdateBranch,
  type ApiBranchListMeta,
  type ApiBranchListResponse,
  type ApiBranchManagementEventResponse,
  type ApiBranchReconcilePreview,
  type ApiBranchResponse,
  type MappedBranchListResult,
} from "./mappers";

const BRANCHES_ENDPOINT = "/branches";

export const branchesApi = {
  getAll: async (
    params?: BranchQueryParams,
  ): Promise<MappedBranchListResult> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };

    if (params?.sort?.field) queryParams.sort_by = params.sort.field;
    if (params?.sort?.direction) queryParams.sort_order = params.sort.direction;

    if (params?.filters?.status) queryParams.status = params.filters.status;
    if (params?.filters?.isMain !== undefined) queryParams.is_main = params.filters.isMain;
    if (params?.filters?.isActive !== undefined) {
      queryParams.is_active = params.filters.isActive;
    }
    if (params?.filters?.search) queryParams.search = params.filters.search;
    if (params?.filters?.createdFrom) {
      queryParams.created_from = params.filters.createdFrom;
    }
    if (params?.filters?.createdTo) {
      queryParams.created_to = params.filters.createdTo;
    }

    const response = await apiClient.get<ApiBranchListResponse>(
      BRANCHES_ENDPOINT,
      {
        params: queryParams,
      },
    );
    return mapPaginatedBranches(response);
  },

  getById: async (id: string): Promise<MappedSingleResult<Branch | null>> => {
    try {
      const response = await apiClient.get<ApiSingleResponse<ApiBranchResponse>>(
        `${BRANCHES_ENDPOINT}/${id}`,
      );
      return mapSingleBranch(response);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status ===
          "number" &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return { data: null };
      }
      throw error;
    }
  },

  create: async (data: CreateBranchDTO): Promise<MappedSingleResult<Branch>> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBranchResponse>>(
      BRANCHES_ENDPOINT,
      toApiCreateBranch(data),
    );
    return mapSingleBranch(response);
  },

  update: async (
    id: string,
    data: UpdateBranchDTO,
  ): Promise<MappedSingleResult<Branch>> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiBranchResponse>>(
      `${BRANCHES_ENDPOINT}/${id}`,
      toApiUpdateBranch(data),
    );
    return mapSingleBranch(response);
  },

  delete: async (id: string): Promise<MappedActionResult> => {
    const response = await apiClient.delete<ApiActionResponse>(
      `${BRANCHES_ENDPOINT}/${id}`,
    );
    return mapActionResponse(response);
  },

  restore: async (id: string): Promise<MappedSingleResult<Branch>> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBranchResponse>>(
      `${BRANCHES_ENDPOINT}/${id}/restore`,
    );
    return mapSingleBranch(response);
  },

  getActivity: async (
    branchId: string,
    params?: { page?: number; limit?: number; action?: string },
  ): Promise<MappedPaginatedResult<BranchManagementEvent>> => {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiBranchManagementEventResponse>
    >(`${BRANCHES_ENDPOINT}/${branchId}/activity`, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 25,
        ...(params?.action ? { action: params.action } : {}),
      },
    });
    return mapPaginatedBranchActivity(response);
  },

  getReconcilePreview: async (): Promise<MappedSingleResult<BranchReconcilePreview>> => {
    const response = await apiClient.get<ApiSingleResponse<ApiBranchReconcilePreview>>(
      `${BRANCHES_ENDPOINT}/reconcile-plan/preview`,
    );
    return mapBranchReconcilePreview(response);
  },

  reconcilePlan: async (input: {
    keepBranchIds: string[];
    mainBranchId?: string;
    employeeReassignments: BranchEmployeeReassignment[];
  }): Promise<MappedSingleResult<BranchListMeta>> => {
    const response = await apiClient.post<ApiSingleResponse<ApiBranchListMeta>>(
      `${BRANCHES_ENDPOINT}/reconcile-plan`,
      {
        keep_branch_ids: input.keepBranchIds,
        ...(input.mainBranchId ? { main_branch_id: input.mainBranchId } : {}),
        employee_reassignments: input.employeeReassignments.map((item) => ({
          from_branch_id: item.fromBranchId,
          to_branch_id: item.toBranchId,
        })),
      },
    );
    return mapBranchCapacityMeta(response);
  },
};
