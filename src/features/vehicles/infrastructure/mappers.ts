/**
 * Vehicle Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Convierte las respuestas de la API (snake_case) a las entidades
 * del dominio (camelCase). Única capa que conoce el formato de la API.
 *
 * ACTUALIZADO: Incluye campos de Carta Porte 3.1
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
  CreateVehiclePayload,
  UpdateVehiclePayload,
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
export interface ApiVehicleListItemResponse {
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
  insurance_policy?: string | null;
  insurance_expiry: string | null;
  sct_permit_number?: string | null;
  sct_permit_expiry: string | null;
  // Carta Porte 3.1
  sat_tipo_permiso_code: string | null;
  sat_config_autotransporte_code: string | null;
}

/** GET /api/v1/vehicles/:id — Full detail shape from backend */
export interface ApiVehicleResponse {
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
  // Carta Porte 3.1 — Autotransporte
  sat_tipo_permiso_code: string | null;
  sat_config_autotransporte_code: string | null;
  peso_bruto_vehicular: number | null;
  insurance_company: string | null;
  asegura_medio_ambiente: string | null;
  poliza_medio_ambiente: string | null;
  asegura_carga: string | null;
  poliza_carga: string | null;
  // Status
  status: string;
  is_active: boolean;
  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  remolques?: ApiVehicleRemolqueResponse[];
}

export interface ApiVehicleRemolqueResponse {
  position: number;
  sat_sub_tipo_rem_code: string;
  license_plate: string;
}

// ============================================================================
// MAPPERS: API → Domain
// ============================================================================

/**
 * Maps a single raw list item from API to domain VehicleListItem
 */
export function mapVehicleListItem(
  raw: ApiVehicleListItemResponse,
): VehicleListItem {
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
    insurancePolicy: raw.insurance_policy ?? null,
    insuranceExpiry: raw.insurance_expiry,
    sctPermitNumber: raw.sct_permit_number ?? null,
    sctPermitExpiry: raw.sct_permit_expiry,
    // Carta Porte 3.1
    satTipoPermisoCode: raw.sat_tipo_permiso_code,
    satConfigAutotransporteCode: raw.sat_config_autotransporte_code,
  };
}

/**
 * Maps a paginated API response to domain MappedPaginatedResult<VehicleListItem>
 */
export function mapVehicleList(
  raw: ApiPaginatedResponse<ApiVehicleListItemResponse>,
): MappedPaginatedResult<VehicleListItem> {
  return {
    data: raw.data.map(mapVehicleListItem),
    pagination: {
      page: raw.pagination.page,
      limit: raw.pagination.limit,
      total: raw.pagination.total,
      totalPages: raw.pagination.total_pages,
    },
  };
}

/**
 * Maps a single raw detail from API to domain Vehicle entity
 */
export function mapVehicleDetail(
  raw: ApiSingleResponse<ApiVehicleResponse>,
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
        insuranceExpiry: raw.data.insurance_expiry,
        sctPermitNumber: raw.data.sct_permit_number,
        sctPermitExpiry: raw.data.sct_permit_expiry,
      },

      // Carta Porte 3.1 (Value Object)
      cartaPorte: {
        satTipoPermisoCode: raw.data.sat_tipo_permiso_code,
        satConfigAutotransporteCode: raw.data.sat_config_autotransporte_code,
        pesoBrutoVehicular: raw.data.peso_bruto_vehicular,
        insuranceCompany: raw.data.insurance_company,
        aseguraMedioAmbiente: raw.data.asegura_medio_ambiente,
        polizaMedioAmbiente: raw.data.poliza_medio_ambiente,
        aseguraCarga: raw.data.asegura_carga,
        polizaCarga: raw.data.poliza_carga,
        remolques: (raw.data.remolques ?? []).map((r) => ({
          position: r.position,
          satSubTipoRemCode: r.sat_sub_tipo_rem_code,
          licensePlate: r.license_plate,
        })),
      },

      // Status
      status: raw.data.status as VehicleStatusType,
      isActive: raw.data.is_active,

      // Audit
      createdAt: new Date(raw.data.created_at),
      updatedAt: new Date(raw.data.updated_at),
      createdBy: raw.data.created_by,
      updatedBy: raw.data.updated_by,
      createdByName: raw.data.created_by_name ?? null,
      updatedByName: raw.data.updated_by_name ?? null,
    },
    message: raw.message,
  };
}

// ============================================================================
// MAPPERS: Domain → API (para requests)
// ============================================================================

/**
 * Convierte CreateVehiclePayload (camelCase) a snake_case para el API
 */
export function toApiCreateVehicle(
  payload: CreateVehiclePayload,
): Record<string, unknown> {
  return {
    unit_number: payload.unitNumber,
    license_plate: payload.licensePlate,
    vin: payload.vin,
    brand: payload.brand,
    model: payload.model,
    year: payload.year,
    type: payload.type,
    color: payload.color,
    load_capacity: payload.loadCapacity,
    volume_capacity: payload.volumeCapacity,
    fuel_tank_capacity: payload.fuelTankCapacity,
    expected_fuel_efficiency: payload.expectedFuelEfficiency,
    current_mileage: payload.currentMileage,
    insurance_policy: payload.insurancePolicy,
    insurance_expiry: payload.insuranceExpiry,
    sct_permit_number: payload.sctPermitNumber,
    sct_permit_expiry: payload.sctPermitExpiry,
    // Carta Porte 3.1 — Autotransporte
    sat_tipo_permiso_code: payload.satTipoPermisoCode,
    sat_config_autotransporte_code: payload.satConfigAutotransporteCode,
    peso_bruto_vehicular: payload.pesoBrutoVehicular,
    insurance_company: payload.insuranceCompany,
    asegura_medio_ambiente: payload.aseguraMedioAmbiente,
    poliza_medio_ambiente: payload.polizaMedioAmbiente,
    asegura_carga: payload.aseguraCarga,
    poliza_carga: payload.polizaCarga,
    remolques: payload.remolques?.map((r) => ({
      sat_sub_tipo_rem_code: r.satSubTipoRemCode,
      license_plate: r.licensePlate,
    })),
  };
}

/**
 * Convierte UpdateVehiclePayload (camelCase) a snake_case para el API
 */
export function toApiUpdateVehicle(
  payload: UpdateVehiclePayload,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (payload.licensePlate !== undefined)
    result.license_plate = payload.licensePlate;
  if (payload.vin !== undefined) result.vin = payload.vin;
  if (payload.brand !== undefined) result.brand = payload.brand;
  if (payload.model !== undefined) result.model = payload.model;
  if (payload.year !== undefined) result.year = payload.year;
  if (payload.type !== undefined) result.type = payload.type;
  if (payload.color !== undefined) result.color = payload.color;
  if (payload.loadCapacity !== undefined)
    result.load_capacity = payload.loadCapacity;
  if (payload.volumeCapacity !== undefined)
    result.volume_capacity = payload.volumeCapacity;
  if (payload.fuelTankCapacity !== undefined)
    result.fuel_tank_capacity = payload.fuelTankCapacity;
  if (payload.expectedFuelEfficiency !== undefined)
    result.expected_fuel_efficiency = payload.expectedFuelEfficiency;
  if (payload.currentMileage !== undefined)
    result.current_mileage = payload.currentMileage;
  if (payload.insurancePolicy !== undefined)
    result.insurance_policy = payload.insurancePolicy;
  if (payload.insuranceExpiry !== undefined)
    result.insurance_expiry = payload.insuranceExpiry;
  if (payload.sctPermitNumber !== undefined)
    result.sct_permit_number = payload.sctPermitNumber;
  if (payload.sctPermitExpiry !== undefined)
    result.sct_permit_expiry = payload.sctPermitExpiry;
  // Carta Porte 3.1 — Autotransporte
  if (payload.satTipoPermisoCode !== undefined)
    result.sat_tipo_permiso_code = payload.satTipoPermisoCode;
  if (payload.satConfigAutotransporteCode !== undefined)
    result.sat_config_autotransporte_code = payload.satConfigAutotransporteCode;
  if (payload.pesoBrutoVehicular !== undefined)
    result.peso_bruto_vehicular = payload.pesoBrutoVehicular;
  if (payload.insuranceCompany !== undefined)
    result.insurance_company = payload.insuranceCompany;
  if (payload.aseguraMedioAmbiente !== undefined)
    result.asegura_medio_ambiente = payload.aseguraMedioAmbiente;
  if (payload.polizaMedioAmbiente !== undefined)
    result.poliza_medio_ambiente = payload.polizaMedioAmbiente;
  if (payload.aseguraCarga !== undefined)
    result.asegura_carga = payload.aseguraCarga;
  if (payload.polizaCarga !== undefined)
    result.poliza_carga = payload.polizaCarga;
  if (payload.remolques !== undefined)
    result.remolques = payload.remolques.map((r) => ({
      sat_sub_tipo_rem_code: r.satSubTipoRemCode,
      license_plate: r.licensePlate,
    }));
  // Status
  if (payload.status !== undefined) result.status = payload.status;
  if (payload.isActive !== undefined) result.is_active = payload.isActive;

  return result;
}
