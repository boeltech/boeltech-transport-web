/**
 * Employee Repository
 * Clean Architecture - Infrastructure Layer
 *
 * Llamadas API para el módulo de empleados.
 * Por ahora solo implementa el endpoint para selector de drivers.
 */

import { apiClient } from "@shared/api";
import type {
  ApiEmployeeForDriverSelection,
  EmployeeSearchParams,
} from "../domain/entities";

// ============================================================================
// API Endpoints
// ============================================================================

const EMPLOYEES_ENDPOINT = "/employees";

// ============================================================================
// Repository Functions
// ============================================================================

/**
 * Obtiene empleados disponibles para ser registrados como conductores.
 * Solo retorna empleados activos que NO tienen registro en drivers.
 */
export async function getAvailableForDriver(
  params?: EmployeeSearchParams,
): Promise<ApiEmployeeForDriverSelection[]> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const queryString = queryParams.toString();
  const url = `${EMPLOYEES_ENDPOINT}/available-for-driver${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<{
    data: ApiEmployeeForDriverSelection[];
  }>(url);

  return response.data;
}

/**
 * Obtiene los datos básicos de un empleado por ID.
 */
export async function getEmployeeBasic(
  employeeId: string,
): Promise<ApiEmployeeForDriverSelection> {
  const response = await apiClient.get<{
    data: ApiEmployeeForDriverSelection;
  }>(`${EMPLOYEES_ENDPOINT}/${employeeId}/basic`);

  return response.data;
}

// ============================================================================
// Export all functions
// ============================================================================

export const employeeRepository = {
  getAvailableForDriver,
  getEmployeeBasic,
};
