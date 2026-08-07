import {
  mapPaginatedResponse,
  mapSingleResponse,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import type { ApiPaginatedResponse, ApiSingleResponse } from "@shared/api";
import type { UserRole } from "@shared/constants/roles";
import type {
  User,
  UserListItem,
  UserListMeta,
  UserManagementEvent,
  UserStatusType,
} from "../domain/entities";
import type { CreateUserDTO, UpdateUserDTO } from "../domain/repository";

export interface ApiUserListItemResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatusType;
  last_login: string | null;
  created_at: string;
}

export interface ApiUserListMeta {
  active_count: number;
  max_users: number | null;
  limit_reached: boolean;
  over_quota: boolean;
  over_quota_count: number;
}

export interface ApiUserListResponse extends ApiPaginatedResponse<ApiUserListItemResponse> {
  meta?: ApiUserListMeta;
}

export interface MappedUserListResult {
  data: UserListItem[];
  pagination: MappedPaginatedResult<UserListItem>["pagination"];
  meta?: UserListMeta;
}

export interface ApiUserResponse extends ApiUserListItemResponse {
  tenant_id: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  client_id?: string | null;
  employee_id?: string | null;
  driver_id?: string | null;
}

export interface ApiUserManagementEventResponse {
  id: string;
  subject_user_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApiUserPayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  client_id?: string | null;
  employee_id?: string | null;
}

export interface ApiUserStatusPayload {
  status: UserStatusType;
}

function mapUserListMeta(meta?: ApiUserListMeta): UserListMeta | undefined {
  if (!meta) return undefined;

  return {
    activeCount: meta.active_count,
    maxUsers: meta.max_users,
    limitReached: meta.limit_reached,
    overQuota: meta.over_quota,
    overQuotaCount: meta.over_quota_count,
  };
}

export const mapPaginatedUsers = (
  response: ApiUserListResponse,
): MappedUserListResult => {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data,
    pagination: mapped.pagination,
    meta: mapUserListMeta(response.meta),
  };
};

export const mapPaginatedUserActivity = (
  response: ApiPaginatedResponse<ApiUserManagementEventResponse>,
): MappedPaginatedResult<UserManagementEvent> => mapPaginatedResponse(response);

export const mapSingleUser = (
  response: ApiSingleResponse<ApiUserResponse>,
): MappedSingleResult<User> => {
  const mapped = mapSingleResponse(response);
  return {
    ...mapped,
    data: {
      ...mapped.data,
      clientId: mapped.data.clientId ?? null,
      employeeId: mapped.data.employeeId ?? null,
      driverId: mapped.data.driverId ?? null,
    },
  };
};

export const toApiCreateUser = (data: CreateUserDTO): ApiUserPayload => ({
  email: data.email,
  password: data.password,
  first_name: data.firstName,
  last_name: data.lastName,
  role: data.role,
  ...(data.clientId !== undefined ? { client_id: data.clientId } : {}),
  ...(data.employeeId !== undefined ? { employee_id: data.employeeId } : {}),
});

export const toApiUpdateUser = (data: UpdateUserDTO): Partial<ApiUserPayload> => {
  const payload: Partial<ApiUserPayload> = {};

  if (data.email !== undefined) payload.email = data.email;
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.role !== undefined) payload.role = data.role;
  if (data.clientId !== undefined) payload.client_id = data.clientId;
  if (data.employeeId !== undefined) payload.employee_id = data.employeeId;

  return payload;
};
