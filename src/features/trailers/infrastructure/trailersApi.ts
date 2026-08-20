/**
 * Trailers API Client (ADR-0077)
 */

import {
  apiClient,
  mapActionResponse,
  type ApiActionResponse,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import {
  mapTrailerDetail,
  mapTrailerList,
  type ApiTrailerListItemResponse,
  type ApiTrailerListPagination,
  type ApiTrailerResponse,
} from "./mappers";
import type {
  CreateTrailerPayload,
  Trailer,
  TrailerListItem,
  TrailerQueryParams,
  TrailerStatusType,
  UpdateTrailerPayload,
} from "../domain";

const TRAILER_ENDPOINT = "/trailers";

interface CreateTrailerRawResponse {
  message: string;
  data: ApiTrailerResponse;
}

export const trailersApi = {
  getAll: async (
    params?: TrailerQueryParams,
  ): Promise<MappedPaginatedResult<TrailerListItem>> => {
    const searchParams = new URLSearchParams();

    if (params?.filters?.status) {
      const statuses = Array.isArray(params.filters.status)
        ? params.filters.status
        : [params.filters.status];
      statuses.forEach((s) => searchParams.append("status", s));
    }
    if (params?.filters?.isActive !== undefined) {
      searchParams.append("is_active", String(params.filters.isActive));
    }
    if (params?.filters?.search) {
      searchParams.append("search", params.filters.search);
    }
    if (params?.filters?.branchId) {
      searchParams.append("branch_id", params.filters.branchId);
    }
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.sort?.field) searchParams.append("sort_by", params.sort.field);
    if (params?.sort?.direction) {
      searchParams.append("sort_order", params.sort.direction);
    }

    const qs = searchParams.toString();
    const url = qs ? `${TRAILER_ENDPOINT}?${qs}` : TRAILER_ENDPOINT;
    const raw = await apiClient.get<{
      data: ApiTrailerListItemResponse[];
      pagination: ApiTrailerListPagination;
    }>(url);

    return mapTrailerList(raw);
  },

  getById: async (id: string): Promise<MappedSingleResult<Trailer>> => {
    const raw = (await apiClient.get(
      `${TRAILER_ENDPOINT}/${id}`,
    )) as unknown as ApiSingleResponse<ApiTrailerResponse>;
    return { data: mapTrailerDetail(raw.data) };
  },

  create: async (
    payload: CreateTrailerPayload,
  ): Promise<MappedSingleResult<{ id: string; licensePlate: string }>> => {
    const response = await apiClient.post<CreateTrailerRawResponse>(
      TRAILER_ENDPOINT,
      payload,
    );
    return {
      data: {
        id: response.data.id,
        licensePlate: response.data.license_plate,
      },
      message: response.message,
    };
  },

  update: async (
    id: string,
    payload: UpdateTrailerPayload,
  ): Promise<MappedSingleResult<Trailer>> => {
    const raw = (await apiClient.put(
      `${TRAILER_ENDPOINT}/${id}`,
      payload,
    )) as unknown as ApiSingleResponse<ApiTrailerResponse>;
    return {
      data: mapTrailerDetail(raw.data),
      message: raw.message,
    };
  },

  updateStatus: async (
    id: string,
    status: TrailerStatusType,
  ): Promise<MappedSingleResult<Trailer>> => {
    const raw = (await apiClient.patch(
      `${TRAILER_ENDPOINT}/${id}/status`,
      { status },
    )) as unknown as ApiSingleResponse<ApiTrailerResponse>;
    return {
      data: mapTrailerDetail(raw.data),
      message: raw.message,
    };
  },

  delete: async (id: string): Promise<MappedActionResult> => {
    const response = await apiClient.delete(`${TRAILER_ENDPOINT}/${id}`);
    return mapActionResponse(response as unknown as ApiActionResponse);
  },
};
