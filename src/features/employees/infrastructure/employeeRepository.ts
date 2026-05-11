/**
 * Employee Repository
 * Clean Architecture - Infrastructure Layer
 */

import { apiClient } from "@shared/api";
import type {
  ApiEmployeeListItem,
  ApiEmployeeResponse,
  ApiEmployeeForDriverSelection,
  EmployeeFilters,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  TerminateEmployeeDTO,
  EmployeeSearchParams,
} from "../domain/entities";
import type { ApiPaginatedResponse, ApiSingleResponse } from "@shared/api";

const BASE = "/employees";

// ============================================================================
// LIST
// ============================================================================

export interface EmployeeListParams extends EmployeeFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function fetchEmployees(
  params: EmployeeListParams = {},
): Promise<ApiPaginatedResponse<ApiEmployeeListItem>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.sortBy) q.set("sort_by", params.sortBy);
  if (params.sortOrder) q.set("sort_order", params.sortOrder);
  if (params.status) q.set("status", params.status);
  if (params.employmentType) q.set("employment_type", params.employmentType);
  if (params.position) q.set("position", params.position);
  if (params.department) q.set("department", params.department);
  if (params.isActive !== undefined) q.set("is_active", String(params.isActive));
  if (params.search) q.set("search", params.search);

  return apiClient.get<ApiPaginatedResponse<ApiEmployeeListItem>>(
    `${BASE}?${q.toString()}`,
  );
}

// ============================================================================
// DETAIL
// ============================================================================

export async function fetchEmployee(
  id: string,
): Promise<ApiSingleResponse<ApiEmployeeResponse>> {
  return apiClient.get<ApiSingleResponse<ApiEmployeeResponse>>(`${BASE}/${id}`);
}

// ============================================================================
// CREATE
// ============================================================================

export async function createEmployee(
  data: CreateEmployeeDTO,
): Promise<ApiSingleResponse<ApiEmployeeResponse>> {
  return apiClient.post<ApiSingleResponse<ApiEmployeeResponse>>(BASE, data);
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeDTO,
): Promise<ApiSingleResponse<ApiEmployeeResponse>> {
  return apiClient.put<ApiSingleResponse<ApiEmployeeResponse>>(
    `${BASE}/${id}`,
    data,
  );
}

// ============================================================================
// TERMINATE
// ============================================================================

export async function terminateEmployee(
  id: string,
  data: TerminateEmployeeDTO,
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`${BASE}/${id}`, {
    data,
  });
}

// ============================================================================
// DRIVER SELECTION (legacy — compatibilidad con módulo drivers)
// ============================================================================

export async function getAvailableForDriver(
  params?: EmployeeSearchParams,
): Promise<ApiEmployeeForDriverSelection[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.position) q.set("position", params.position);
  const qs = q.toString();
  const response = await apiClient.get<{ data: ApiEmployeeForDriverSelection[] }>(
    `${BASE}/available-for-driver${qs ? `?${qs}` : ""}`,
  );
  return response.data;
}

export async function getEmployeeBasic(
  employeeId: string,
): Promise<ApiEmployeeForDriverSelection> {
  const response = await apiClient.get<{
    data: ApiEmployeeForDriverSelection;
  }>(`${BASE}/${employeeId}/basic`);
  return response.data;
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const employeeRepository = {
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  getAvailableForDriver,
  getEmployeeBasic,
};
