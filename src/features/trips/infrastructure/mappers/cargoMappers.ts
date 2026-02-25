/**
 * Cargo Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma datos entre API (snake_case) y dominio (camelCase).
 */

import type {
  TripCargo,
  CargoMovement,
  CargoStatusType,
  CargoMovementTypeValue,
} from "@features/trips/domain/entities";
import type {
  CreateCargoDTO,
  UpdateCargoDTO,
  CreateCargoMovementDTO,
} from "@features/trips/domain";
import type { MappedSingleResult } from "@shared/api";

// ============================================================================
// API RESPONSE TYPES (snake_case)
// ============================================================================

export interface ApiCargoMovementResponse {
  id: string;
  cargo_id: string;
  stop_id: string;
  stop_index: number;
  movement_type: CargoMovementTypeValue;
  weight: number | null;
  units: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCargoResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  client_id: string;
  client?: {
    id: string;
    legal_name: string;
  };
  description: string;
  product_type: string | null;
  weight: number | null;
  volume: number | null;
  units: number | null;
  declared_value: number | null;
  rate: number;
  currency: string;
  movements: ApiCargoMovementResponse[];
  pickup_stop_id: string | null;
  delivery_stop_id: string | null;
  status: CargoStatusType;
  picked_up_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  special_instructions: string | null;
  // Carta Porte
  sat_product_code: string | null;
  sat_unit_code: string | null;
  sat_unit_name: string | null;
  weight_in_kg: number | null;
  dimensions: string | null;
  hazardous_material: boolean | null;
  hazardous_material_code: string | null;
  packaging_type: string | null;
  packaging_description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================================
// API → DOMAIN MAPPERS
// ============================================================================

/**
 * Mapea movimiento de carga de API a dominio
 */
export function mapApiCargoMovement(
  api: ApiCargoMovementResponse,
): CargoMovement {
  return {
    id: api.id,
    cargoId: api.cargo_id,
    stopId: api.stop_id,
    stopIndex: api.stop_index,
    movementType: api.movement_type,
    weight: api.weight,
    units: api.units,
    completedAt: api.completed_at ? new Date(api.completed_at) : null,
    notes: api.notes,
  };
}

/**
 * Mapea carga de API a dominio
 */
export function mapApiCargo(api: ApiCargoResponse): TripCargo {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    clientId: api.client_id,
    client: api.client
      ? {
          id: api.client.id,
          legalName: api.client.legal_name,
        }
      : undefined,
    description: api.description,
    productType: api.product_type,
    weight: api.weight,
    volume: api.volume,
    units: api.units,
    declaredValue: api.declared_value,
    rate: api.rate,
    currency: api.currency,
    movements: api.movements?.map(mapApiCargoMovement) || [],
    pickupStopId: api.pickup_stop_id,
    deliveryStopId: api.delivery_stop_id,
    status: api.status,
    pickedUpAt: api.picked_up_at ? new Date(api.picked_up_at) : null,
    deliveredAt: api.delivered_at ? new Date(api.delivered_at) : null,
    notes: api.notes,
    specialInstructions: api.special_instructions,
    // Carta Porte
    satProductCode: api.sat_product_code,
    satUnitCode: api.sat_unit_code,
    satUnitName: api.sat_unit_name,
    weightInKg: api.weight_in_kg,
    dimensions: api.dimensions,
    hazardousMaterial: api.hazardous_material,
    hazardousMaterialCode: api.hazardous_material_code,
    packagingType: api.packaging_type,
    packagingDescription: api.packaging_description,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
  };
}

// ============================================================================
// RESPONSE MAPPERS (con mensaje)
// ============================================================================

/**
 * Mapea respuesta de API con array de cargas
 */
export function mapCargosResponse(response: {
  data: ApiCargoResponse[];
  message?: string;
}): MappedSingleResult<TripCargo[]> {
  return {
    data: response.data.map(mapApiCargo),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con una carga
 */
export function mapCargoResponse(response: {
  data: ApiCargoResponse;
  message?: string;
}): MappedSingleResult<TripCargo> {
  return {
    data: mapApiCargo(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con un movimiento
 */
export function mapCargoMovementResponse(response: {
  data: ApiCargoMovementResponse;
  message?: string;
}): MappedSingleResult<CargoMovement> {
  return {
    data: mapApiCargoMovement(response.data),
    message: response.message,
  };
}

// ============================================================================
// DOMAIN → API MAPPERS (camelCase → snake_case)
// ============================================================================

/**
 * Convierte DTO de crear carga a formato API
 */
export function toApiCreateCargo(dto: CreateCargoDTO): Record<string, unknown> {
  return {
    client_id: dto.clientId,
    description: dto.description,
    product_type: dto.productType,
    weight: dto.weight,
    volume: dto.volume,
    units: dto.units,
    declared_value: dto.declaredValue,
    rate: dto.rate,
    currency: dto.currency ?? "MXN",
    pickup_stop_id: dto.pickupStopId,
    delivery_stop_id: dto.deliveryStopId,
    notes: dto.notes,
    special_instructions: dto.specialInstructions,
    movements: dto.movements?.map((m) => ({
      stop_id: m.stopId,
      stop_index: m.stopIndex,
      movement_type: m.movementType,
      weight: m.weight,
      units: m.units,
      notes: m.notes,
    })),
    // Carta Porte
    sat_product_code: dto.satProductCode,
    sat_unit_code: dto.satUnitCode,
    sat_unit_name: dto.satUnitName,
    weight_in_kg: dto.weightInKg,
    dimensions: dto.dimensions,
    hazardous_material: dto.hazardousMaterial,
    hazardous_material_code: dto.hazardousMaterialCode,
    packaging_type: dto.packagingType,
    packaging_description: dto.packagingDescription,
  };
}

/**
 * Convierte DTO de actualizar carga a formato API
 */
export function toApiUpdateCargo(dto: UpdateCargoDTO): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.description !== undefined) result.description = dto.description;
  if (dto.productType !== undefined) result.product_type = dto.productType;
  if (dto.weight !== undefined) result.weight = dto.weight;
  if (dto.volume !== undefined) result.volume = dto.volume;
  if (dto.units !== undefined) result.units = dto.units;
  if (dto.declaredValue !== undefined)
    result.declared_value = dto.declaredValue;
  if (dto.rate !== undefined) result.rate = dto.rate;
  if (dto.currency !== undefined) result.currency = dto.currency;
  if (dto.pickupStopId !== undefined) result.pickup_stop_id = dto.pickupStopId;
  if (dto.deliveryStopId !== undefined)
    result.delivery_stop_id = dto.deliveryStopId;
  if (dto.notes !== undefined) result.notes = dto.notes;
  if (dto.specialInstructions !== undefined)
    result.special_instructions = dto.specialInstructions;
  if (dto.status !== undefined) result.status = dto.status;
  // Carta Porte
  if (dto.satProductCode !== undefined)
    result.sat_product_code = dto.satProductCode;
  if (dto.satUnitCode !== undefined) result.sat_unit_code = dto.satUnitCode;
  if (dto.satUnitName !== undefined) result.sat_unit_name = dto.satUnitName;
  if (dto.weightInKg !== undefined) result.weight_in_kg = dto.weightInKg;
  if (dto.dimensions !== undefined) result.dimensions = dto.dimensions;
  if (dto.hazardousMaterial !== undefined)
    result.hazardous_material = dto.hazardousMaterial;
  if (dto.hazardousMaterialCode !== undefined)
    result.hazardous_material_code = dto.hazardousMaterialCode;
  if (dto.packagingType !== undefined)
    result.packaging_type = dto.packagingType;
  if (dto.packagingDescription !== undefined)
    result.packaging_description = dto.packagingDescription;

  return result;
}

/**
 * Convierte DTO de crear movimiento a formato API
 */
export function toApiCreateCargoMovement(
  dto: CreateCargoMovementDTO,
): Record<string, unknown> {
  return {
    stop_id: dto.stopId,
    stop_index: dto.stopIndex,
    movement_type: dto.movementType,
    weight: dto.weight,
    units: dto.units,
    notes: dto.notes,
  };
}
