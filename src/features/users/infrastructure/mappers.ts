import {
  mapPaginatedResponse,
  mapSingleResponse,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import type { ApiPaginatedResponse, ApiSingleResponse } from "@shared/api";
import type { UserRole } from "@shared/constants/roles";
import type { User, UserListItem, UserManagementEvent, UserStatusType } from "../domain/entities";
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

export interface ApiUserResponse extends ApiUserListItemResponse {
  tenant_id: string;
  updated_at: string;
}

export interface ApiUserManagementEventResponse {
  id: string;
  subject_user_id: string;
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
}

export interface ApiUserStatusPayload {
  status: UserStatusType;
}

export const mapPaginatedUsers = (
  response: ApiPaginatedResponse<ApiUserListItemResponse>,
): MappedPaginatedResult<UserListItem> => mapPaginatedResponse(response);

export const mapPaginatedUserActivity = (
  response: ApiPaginatedResponse<ApiUserManagementEventResponse>,
): MappedPaginatedResult<UserManagementEvent> => mapPaginatedResponse(response);

export const mapSingleUser = (
  response: ApiSingleResponse<ApiUserResponse>,
): MappedSingleResult<User> => mapSingleResponse(response);

export const toApiCreateUser = (data: CreateUserDTO): ApiUserPayload => ({
  email: data.email,
  password: data.password,
  first_name: data.firstName,
  last_name: data.lastName,
  role: data.role,
});

export const toApiUpdateUser = (data: UpdateUserDTO): Partial<ApiUserPayload> => {
  const payload: Partial<ApiUserPayload> = {};

  if (data.email !== undefined) payload.email = data.email;
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.role !== undefined) payload.role = data.role;

  return payload;
};
