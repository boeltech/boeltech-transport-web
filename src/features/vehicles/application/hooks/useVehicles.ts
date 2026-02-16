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
  insuranceExpiry?: Date;
  sctPermitExpiry?: Date;
}

/**
 * Vehículo enriquecido con estado de asignabilidad
 */
export interface AssignableVehicleItem extends VehicleListItem {
  canBeAssigned: boolean;
  blockReason?: string;
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
  insurance_expiry?: string;
  sct_permit_expiry?: string;
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
    insuranceExpiry: api.insurance_expiry
      ? new Date(api.insurance_expiry)
      : undefined,
    sctPermitExpiry: api.sct_permit_expiry
      ? new Date(api.sct_permit_expiry)
      : undefined,
  };
}

/**
 * Clasifica un vehículo como asignable o bloqueado
 */
function classifyVehicleForAssignment(
  vehicle: VehicleListItem,
): AssignableVehicleItem {
  // Status no disponible
  if (vehicle.status !== "available") {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: `Estado: ${vehicle.status}`,
    };
  }

  // Seguro vencido
  if (
    vehicle.insuranceExpiry &&
    new Date(vehicle.insuranceExpiry) < new Date()
  ) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Seguro vencido",
    };
  }

  // Permiso SCT vencido
  if (
    vehicle.sctPermitExpiry &&
    new Date(vehicle.sctPermitExpiry) < new Date()
  ) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Permiso SCT vencido",
    };
  }

  return { ...vehicle, canBeAssigned: true };
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
  assignable: () => [...vehicleKeys.all, "assignable"] as const,
};

/**
 * Hook para obtener listado de vehículos
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
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

/**
 * Hook para obtener vehículos clasificados por asignabilidad.
 * Retorna TODOS los vehículos activos + disponibles, clasificados como
 * asignables o bloqueados (seguro vencido, permiso SCT vencido).
 *
 * Los bloqueados se muestran en el select pero deshabilitados con la razón.
 */
export function useAssignableVehicles(
  options?: Omit<
    UseQueryOptions<AssignableVehicleItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: vehicleKeys.assignable(),
    queryFn: async (): Promise<AssignableVehicleItem[]> => {
      const vehicles = await fetchVehicles({
        status: "available",
        isActive: true,
      });
      return vehicles.map(classifyVehicleForAssignment);
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { fetchVehicles };
