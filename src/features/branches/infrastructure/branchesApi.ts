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
import type { Branch, BranchListItem, BranchQueryParams } from "../domain/entities";
import type { CreateBranchDTO, UpdateBranchDTO } from "../domain/repository";
import {
  mapPaginatedBranches,
  mapSingleBranch,
  toApiCreateBranch,
  toApiUpdateBranch,
  type ApiBranchListItemResponse,
  type ApiBranchResponse,
} from "./mappers";

const BRANCHES_ENDPOINT = "/branches";

export const branchesApi = {
  getAll: async (
    params?: BranchQueryParams,
  ): Promise<MappedPaginatedResult<BranchListItem>> => {
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

    const response = await apiClient.get<
      ApiPaginatedResponse<ApiBranchListItemResponse>
    >(BRANCHES_ENDPOINT, {
      params: queryParams,
    });
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
};
