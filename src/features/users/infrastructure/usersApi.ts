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
import type { User, UserListItem, UserManagementEvent, UserQueryParams } from "../domain/entities";
import type {
  CreateUserDTO,
  UpdateUserDTO,
  UpdateUserStatusDTO,
} from "../domain/repository";
import {
  mapPaginatedUserActivity,
  mapPaginatedUsers,
  mapSingleUser,
  toApiCreateUser,
  toApiUpdateUser,
  type ApiUserListItemResponse,
  type ApiUserManagementEventResponse,
  type ApiUserResponse,
} from "./mappers";

const USERS_ENDPOINT = "/users";

export const usersApi = {
  getAll: async (
    params?: UserQueryParams,
  ): Promise<MappedPaginatedResult<UserListItem>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };

    if (params?.sort?.field) queryParams.sort_by = params.sort.field;
    if (params?.sort?.direction) queryParams.sort_order = params.sort.direction;

    if (params?.filters?.role) queryParams.role = params.filters.role;
    if (params?.filters?.status) queryParams.status = params.filters.status;
    if (params?.filters?.search) queryParams.search = params.filters.search;
    if (params?.filters?.createdFrom) queryParams.created_from = params.filters.createdFrom;
    if (params?.filters?.createdTo) queryParams.created_to = params.filters.createdTo;
    if (params?.filters?.lastLoginFrom) queryParams.last_login_from = params.filters.lastLoginFrom;
    if (params?.filters?.lastLoginTo) queryParams.last_login_to = params.filters.lastLoginTo;

    const response = await apiClient.get<ApiPaginatedResponse<ApiUserListItemResponse>>(
      USERS_ENDPOINT,
      {
        params: queryParams,
      },
    );
    return mapPaginatedUsers(response);
  },

  getActivity: async (
    userId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MappedPaginatedResult<UserManagementEvent>> => {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiUserManagementEventResponse>
    >(`${USERS_ENDPOINT}/${userId}/activity`, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 25,
      },
    });
    return mapPaginatedUserActivity(response);
  },

  getById: async (id: string): Promise<MappedSingleResult<User | null>> => {
    try {
      const response = await apiClient.get<ApiSingleResponse<ApiUserResponse>>(
        `${USERS_ENDPOINT}/${id}`,
      );
      return mapSingleUser(response);
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

  create: async (data: CreateUserDTO): Promise<MappedSingleResult<User>> => {
    const response = await apiClient.post<ApiSingleResponse<ApiUserResponse>>(
      USERS_ENDPOINT,
      toApiCreateUser(data),
    );
    return mapSingleUser(response);
  },

  update: async (id: string, data: UpdateUserDTO): Promise<MappedSingleResult<User>> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiUserResponse>>(
      `${USERS_ENDPOINT}/${id}`,
      toApiUpdateUser(data),
    );
    return mapSingleUser(response);
  },

  updateStatus: async (
    id: string,
    data: UpdateUserStatusDTO,
  ): Promise<MappedSingleResult<User>> => {
    const response = await apiClient.patch<ApiSingleResponse<ApiUserResponse>>(
      `${USERS_ENDPOINT}/${id}/status`,
      data,
    );
    return mapSingleUser(response);
  },

  delete: async (id: string): Promise<MappedActionResult> => {
    const response = await apiClient.delete<ApiActionResponse>(
      `${USERS_ENDPOINT}/${id}`,
    );
    return mapActionResponse(response);
  },
};
