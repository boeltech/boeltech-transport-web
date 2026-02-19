/**
 * Vehicle Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Convierte las respuestas de la API (snake_case) a las entidades
 * del dominio (camelCase). Única capa que conoce el formato de la API.
 *
 * Ubicación: src/features/vehicles/infrastructure/mappers.ts
 *
 * REGLA: Solo este archivo sabe que la API usa snake_case.
 *        El resto del frontend trabaja con las entidades del dominio.
 */

import type {
  Vehicle,
  VehicleListItem,
  VehicleStatusType,
  VehicleTypeValue,
} from "@features/vehicles/domain";
import type {
  ApiPaginatedResponse,
  ApiSingleResponse,
  MappedPaginatedResult,
  MappedSingleResult,
} from "@shared/api";

// ============================================================================
// RAW API TYPES (snake_case — solo usados en este archivo)
// ============================================================================

/** GET /api/v1/vehicles — List item shape from backend */
interface VehicleListItemRaw {
  id: string;
  unit_number: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  color: string | null;
  status: string;
  current_mileage: number;
  is_active: boolean;
  insurance_expiry: string | null;
  sct_permit_expiry: string | null;
}

/** GET /api/v1/vehicles/:id — Full detail shape from backend */
interface VehicleDetailRaw {
  id: string;
  tenant_id: string;
  unit_number: string;
  license_plate: string;
  vin: string | null;
  brand: string;
  model: string;
  year: number;
  type: string;
  color: string | null;
  load_capacity: number | null;
  volume_capacity: number | null;
  fuel_tank_capacity: number | null;
  expected_fuel_efficiency: number | null;
  current_mileage: number;
  insurance_policy: string | null;
  insurance_expiry: string | null;
  sct_permit_number: string | null;
  sct_permit_expiry: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Paginated response from backend */
// interface PaginatedRaw<T> {
//   data: T[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
// }

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Maps a single raw list item from API to domain VehicleListItem
 */
export function mapVehicleListItem(raw: VehicleListItemRaw): VehicleListItem {
  return {
    id: raw.id,
    unitNumber: raw.unit_number,
    licensePlate: raw.license_plate,
    brand: raw.brand,
    model: raw.model,
    year: raw.year,
    type: raw.type as VehicleTypeValue,
    color: raw.color,
    status: raw.status as VehicleStatusType,
    currentMileage: raw.current_mileage,
    isActive: raw.is_active,
    insuranceExpiry: raw.insurance_expiry,
    sctPermitExpiry: raw.sct_permit_expiry,
  };
}

/**
 * Maps a paginated API response to domain MappedPaginatedResult<VehicleListItem>
 */
export function mapVehicleList(
  raw: ApiPaginatedResponse<VehicleListItemRaw>,
): MappedPaginatedResult<VehicleListItem> {
  return {
    data: raw.data.map(mapVehicleListItem),
    pagination: raw.pagination,
  };
}

/**
 * Maps a single raw detail from API to domain Vehicle entity
 */
export function mapVehicleDetail(
  raw: ApiSingleResponse<VehicleDetailRaw>,
): MappedSingleResult<Vehicle> {
  return {
    data: {
      id: raw.data.id,
      tenantId: raw.data.tenant_id,

      // Identification
      unitNumber: raw.data.unit_number,
      licensePlate: raw.data.license_plate,
      vin: raw.data.vin,

      // Characteristics
      brand: raw.data.brand,
      model: raw.data.model,
      year: raw.data.year,
      type: raw.data.type as VehicleTypeValue,
      color: raw.data.color,

      // Capacities (Value Object)
      capacities: {
        loadCapacity: raw.data.load_capacity,
        volumeCapacity: raw.data.volume_capacity,
        fuelTankCapacity: raw.data.fuel_tank_capacity,
        expectedFuelEfficiency: raw.data.expected_fuel_efficiency,
      },

      // Mileage
      currentMileage: raw.data.current_mileage,

      // Documentation (Value Object)
      documentation: {
        insurancePolicy: raw.data.insurance_policy,
        insuranceExpiry: raw.data.insurance_expiry
          ? new Date(raw.data.insurance_expiry)
          : null,
        sctPermitNumber: raw.data.sct_permit_number,
        sctPermitExpiry: raw.data.sct_permit_expiry
          ? new Date(raw.data.sct_permit_expiry)
          : null,
      },

      // Status
      status: raw.data.status as VehicleStatusType,
      isActive: raw.data.is_active,

      // Audit
      createdAt: new Date(raw.data.created_at),
      updatedAt: new Date(raw.data.updated_at),
      createdBy: raw.data.created_by,
      updatedBy: raw.data.updated_by,
    },
    message: raw.message,
  };
}
