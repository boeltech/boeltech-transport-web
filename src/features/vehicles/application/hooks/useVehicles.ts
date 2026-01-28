/**
 * useVehicles Hook
 * FSD: Features Layer - Vehicles
 *
 * Hook para obtener listado de vehículos con filtros opcionales.
 * Usado principalmente en formularios para seleccionar vehículos disponibles.
 *
 * Ubicación: src/features/vehicles/application/hooks/useVehicles.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Estado del vehículo
 */
export type VehicleStatus =
  | "available"
  | "on_trip"
  | "maintenance"
  | "inactive";

/**
 * Tipo de vehículo
 */
export type VehicleType = "truck" | "trailer" | "van" | "pickup";

/**
 * Vehículo para listados y selects
 */
export interface VehicleListItem {
  id: string;
  unitNumber: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  currentMileage: number;
  isActive: boolean;
}

/**
 * Filtros para consulta de vehículos
 */
export interface VehicleFilters {
  status?: VehicleStatus | VehicleStatus[];
  type?: VehicleType;
  isActive?: boolean;
  search?: string;
}

/**
 * Respuesta de la API (snake_case)
 */
interface ApiVehicleListItem {
  id: string;
  unit_number: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  current_mileage: number;
  is_active: boolean;
}

interface ApiPaginatedResponse {
  data: ApiVehicleListItem[];
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
function mapVehicleListItem(api: ApiVehicleListItem): VehicleListItem {
  return {
    id: api.id,
    unitNumber: api.unit_number,
    licensePlate: api.license_plate,
    brand: api.brand,
    model: api.model,
    year: api.year,
    type: api.type,
    status: api.status,
    currentMileage: api.current_mileage,
    isActive: api.is_active,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const VEHICLES_ENDPOINT = "/vehicles";

/**
 * Obtiene listado de vehículos
 */
async function fetchVehicles(
  filters?: VehicleFilters,
): Promise<VehicleListItem[]> {
  const params = new URLSearchParams();

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach((s) => params.append("status", s));
    } else {
      params.append("status", filters.status);
    }
  }

  if (filters?.type) {
    params.append("type", filters.type);
  }

  if (filters?.isActive !== undefined) {
    params.append("is_active", String(filters.isActive));
  }

  if (filters?.search) {
    params.append("search", filters.search);
  }

  // Obtener todos los vehículos (sin paginación para selects)
  params.append("limit", "100");

  const response = await apiClient.get<ApiPaginatedResponse>(
    `${VEHICLES_ENDPOINT}?${params.toString()}`,
  );

  return response.data.map(mapVehicleListItem);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Query keys para vehículos
 */
export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (filters?: VehicleFilters) =>
    [...vehicleKeys.lists(), filters] as const,
  available: () =>
    [...vehicleKeys.list({ status: "available", isActive: true })] as const,
};

/**
 * Hook para obtener listado de vehículos
 *
 * @example
 * // Todos los vehículos
 * const { data: vehicles } = useVehicles();
 *
 * // Solo vehículos disponibles
 * const { data: vehicles } = useVehicles({ status: 'available' });
 *
 * // Vehículos activos de tipo truck
 * const { data: vehicles } = useVehicles({ type: 'truck', isActive: true });
 */
export function useVehicles(
  filters?: VehicleFilters,
  options?: Omit<
    UseQueryOptions<VehicleListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => fetchVehicles(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener vehículos disponibles (para asignar a viajes)
 *
 * @example
 * const { data: availableVehicles, isLoading } = useAvailableVehicles();
 */
export function useAvailableVehicles(
  options?: Omit<
    UseQueryOptions<VehicleListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: vehicleKeys.available(),
    queryFn: () => fetchVehicles({ status: "available", isActive: true }),
    staleTime: 1000 * 60 * 2, // 2 minutos (datos que cambian frecuentemente)
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { fetchVehicles };
