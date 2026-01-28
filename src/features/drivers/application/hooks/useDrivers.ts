/**
 * useDrivers Hook
 * FSD: Features Layer - Drivers
 *
 * Hook para obtener listado de conductores con filtros opcionales.
 * Usado principalmente en formularios para seleccionar conductores disponibles.
 *
 * Ubicación: src/features/drivers/hooks/useDrivers.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Estado del conductor
 */
export type DriverStatus =
  | "available"
  | "on_trip"
  | "rest"
  | "vacation"
  | "inactive";

/**
 * Tipo de licencia
 */
export type LicenseType = "A" | "B" | "C" | "D" | "E" | "federal";

/**
 * Conductor para listados y selects
 */
export interface DriverListItem {
  id: string;
  employeeNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  phone: string;
  licenseType: LicenseType;
  licenseNumber: string;
  licenseExpiry: Date;
  status: DriverStatus;
  isActive: boolean;
}

/**
 * Filtros para consulta de conductores
 */
export interface DriverFilters {
  status?: DriverStatus | DriverStatus[];
  licenseType?: LicenseType;
  isActive?: boolean;
  search?: string;
}

/**
 * Respuesta de la API (snake_case)
 */
interface ApiDriverListItem {
  id: string;
  employee_number: string;
  full_name: string;
  first_name: string;
  last_name: string;
  second_last_name?: string;
  phone: string;
  license_type: LicenseType;
  license_number: string;
  license_expiry: string;
  status: DriverStatus;
  is_active: boolean;
}

interface ApiPaginatedResponse {
  data: ApiDriverListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// MAPPER
// ============================================================================

/**
 * Mapea respuesta de API (snake_case) a dominio (camelCase)
 */
function mapDriverListItem(api: ApiDriverListItem): DriverListItem {
  return {
    id: api.id,
    employeeNumber: api.employee_number,
    fullName: api.full_name,
    firstName: api.first_name,
    lastName: api.last_name,
    secondLastName: api.second_last_name,
    phone: api.phone,
    licenseType: api.license_type,
    licenseNumber: api.license_number,
    licenseExpiry: new Date(api.license_expiry),
    status: api.status,
    isActive: api.is_active,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const DRIVERS_ENDPOINT = "/drivers";

/**
 * Obtiene listado de conductores
 */
async function fetchDrivers(
  filters?: DriverFilters,
): Promise<DriverListItem[]> {
  const params = new URLSearchParams();

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach((s) => params.append("status", s));
    } else {
      params.append("status", filters.status);
    }
  }

  if (filters?.licenseType) {
    params.append("license_type", filters.licenseType);
  }

  if (filters?.isActive !== undefined) {
    params.append("is_active", String(filters.isActive));
  }

  if (filters?.search) {
    params.append("search", filters.search);
  }

  // Obtener todos los conductores (sin paginación para selects)
  params.append("limit", "100");

  const response = await apiClient.get<ApiPaginatedResponse>(
    `${DRIVERS_ENDPOINT}?${params.toString()}`,
  );

  return response.data.map(mapDriverListItem);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Query keys para conductores
 */
export const driverKeys = {
  all: ["drivers"] as const,
  lists: () => [...driverKeys.all, "list"] as const,
  list: (filters?: DriverFilters) => [...driverKeys.lists(), filters] as const,
  available: () =>
    [...driverKeys.list({ status: "available", isActive: true })] as const,
};

/**
 * Hook para obtener listado de conductores
 *
 * @example
 * // Todos los conductores
 * const { data: drivers } = useDrivers();
 *
 * // Solo conductores disponibles
 * const { data: drivers } = useDrivers({ status: 'available' });
 *
 * // Conductores con licencia federal
 * const { data: drivers } = useDrivers({ licenseType: 'federal', isActive: true });
 */
export function useDrivers(
  filters?: DriverFilters,
  options?: Omit<
    UseQueryOptions<DriverListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: driverKeys.list(filters),
    queryFn: () => fetchDrivers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener conductores disponibles (para asignar a viajes)
 *
 * @example
 * const { data: availableDrivers, isLoading } = useAvailableDrivers();
 */
export function useAvailableDrivers(
  options?: Omit<
    UseQueryOptions<DriverListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: driverKeys.available(),
    queryFn: () => fetchDrivers({ status: "available", isActive: true }),
    staleTime: 1000 * 60 * 2, // 2 minutos (datos que cambian frecuentemente)
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { fetchDrivers };
