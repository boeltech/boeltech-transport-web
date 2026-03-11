/**
 * Trip Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforman respuestas del backend (snake_case) a entidades de dominio (camelCase).
 *
 * PATRÓN:
 * - ApiResponse types: snake_case (tipar respuesta exacta del backend)
 * - map*() functions: snake_case → camelCase
 * - NO hay toApi*() functions (apiClient hace deepToSnake automáticamente)
 *
 * Ubicación: src/features/trips/infrastructure/mappers/tripMappers.ts
 */

import type {
  Trip,
  TripListItem,
  TripStop,
  TripCargo,
  TripExpense,
  CargoMovement,
  TripStatusHistory,
  TripStatusType,
} from "@features/trips/domain";
import type { CreateTripResult } from "@features/trips/application/useCases/trip/CreateTripUseCase";
import type { ApiStopResponse } from "./stopMappers";
import type {
  ApiCargoMovementResponse,
  ApiCargoResponse,
} from "./cargoMappers";
import type { ApiExpenseResponse } from "./expenseMappers";

// ============================================================================
// API RESPONSE TYPES (snake_case - estructura exacta del backend)
// ============================================================================

/**
 * Viaje en listado (respuesta del backend)
 */
export interface ApiTripListItemResponse {
  id: string;
  trip_code: string;
  vehicle_id: string;
  vehicle_unit_number: string;
  vehicle_license_plate: string;
  driver_id: string;
  driver_full_name: string;
  client_id: string | null;
  client_legal_name: string | null;
  origin_city: string;
  destination_city: string;
  scheduled_departure: string;
  scheduled_arrival: string | null;
  status: string;
  cargo_description: string | null;
  total_cost: string | number;
  created_at: string;
}

/**
 * Viaje detallado (respuesta del backend)
 */
export interface ApiTripResponse {
  id: string;
  tenant_id: string;
  trip_code: string;
  vehicle_id: string;
  driver_id: string;
  client_id: string | null;
  scheduled_departure: string;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  start_mileage: number | null;
  end_mileage: number | null;
  origin_address: string;
  origin_city: string;
  origin_state: string | null;
  destination_address: string;
  destination_city: string;
  destination_state: string | null;
  cargo_description: string | null;
  cargo_weight: string | number | null;
  cargo_volume: string | number | null;
  cargo_units: number | null;
  cargo_value: string | number | null;
  base_rate: string | number;
  fuel_cost: string | number;
  toll_cost: string | number;
  other_costs: string | number;
  total_cost: string | number;
  status: string;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Relaciones
  vehicle?: ApiVehicleRefResponse;
  driver?: ApiDriverRefResponse;
  client?: ApiClientRefResponse | null;
  stops?: ApiStopResponse[];
  cargos?: ApiCargoResponse[];
  expenses?: ApiExpenseResponse[];
  status_history?: ApiStatusHistoryResponse[];
}

export interface ApiVehicleRefResponse {
  id: string;
  unit_number: string;
  license_plate: string;
}

export interface ApiDriverRefResponse {
  id: string;
  full_name: string;
}

export interface ApiClientRefResponse {
  id: string;
  legal_name: string;
}

// export interface ApiTripStopResponse {
//   id: string;
//   trip_id: string;
//   sequence_order: number;
//   stop_type: string | string[];
//   address: string;
//   city: string;
//   state: string | null;
//   postal_code: string | null;
//   latitude: number | null;
//   longitude: number | null;
//   location_name: string | null;
//   contact_name: string | null;
//   contact_phone: string | null;
//   estimated_arrival: string | null;
//   actual_arrival: string | null;
//   notes: string | null;
// }

// export interface ApiTripCargoResponse {
//   id: string;
//   trip_id: string;
//   client_id: string;
//   description: string;
//   product_type: string | null;
//   weight: number | null;
//   volume: number | null;
//   units: number | null;
//   declared_value: number | null;
//   rate: number;
//   currency: string;
//   status: string;
//   notes: string | null;
//   special_instructions: string | null;
//   movements?: ApiCargoMovementResponse[];
// }

// export interface ApiCargoMovementResponse {
//   id: string;
//   cargo_id: string;
//   stop_id: string;
//   stop_index: number;
//   movement_type: string;
//   weight: number | null;
//   units: number | null;
//   completed_at: string | null;
//   notes: string | null;
// }

// export interface ApiTripExpenseResponse {
//   id: string;
//   trip_id: string;
//   category: string;
//   description: string;
//   amount: number;
//   currency: string;
//   expense_date: string;
//   location: string | null;
//   has_receipt: boolean;
//   receipt_url: string | null;
//   vendor_name: string | null;
//   is_estimated: boolean;
//   status: string;
//   notes: string | null;
// }

export interface ApiStatusHistoryResponse {
  id: string;
  trip_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  mileage: number | null;
  latitude: string | number | null;
  longitude: string | number | null;
  reason: string | null;
}

/**
 * Respuesta del endpoint transaccional POST /trips/with-details
 */
export interface ApiCreateTripResponse {
  message: string;
  data: {
    trip: ApiTripResponse;
    summary: {
      trip_id: string;
      trip_code: string;
      stops_created: number;
      cargos_created: number;
      expenses_created: number;
      final_status: string;
    };
  };
}

// ============================================================================
// MAPPER FUNCTIONS (snake_case → camelCase)
// ============================================================================

/**
 * Convierte un número que puede venir como string
 */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

function toNumberOrDefault(
  value: string | number | null | undefined,
  defaultValue = 0,
): number {
  const num = toNumber(value);
  return num ?? defaultValue;
}

/**
 * Mapea item de listado
 */
export function mapTripListItem(api: ApiTripListItemResponse): TripListItem {
  return {
    id: api.id,
    tripCode: api.trip_code,
    vehicle: {
      id: api.vehicle_id,
      unitNumber: api.vehicle_unit_number,
      licensePlate: api.vehicle_license_plate,
    },
    driver: {
      id: api.driver_id,
      fullName: api.driver_full_name,
    },
    client: api.client_id
      ? {
          id: api.client_id,
          legalName: api.client_legal_name || "",
        }
      : null,
    originCity: api.origin_city,
    destinationCity: api.destination_city,
    scheduledDeparture: new Date(api.scheduled_departure),
    scheduledArrival: api.scheduled_arrival
      ? new Date(api.scheduled_arrival)
      : null,
    status: api.status as TripStatusType,
    cargoDescription: api.cargo_description,
    totalCost: toNumberOrDefault(api.total_cost),
    createdAt: new Date(api.created_at),
  };
}

/**
 * Mapea viaje detallado
 */
export function mapTrip(api: ApiTripResponse): Trip {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripCode: api.trip_code,
    vehicleId: api.vehicle_id,
    driverId: api.driver_id,
    clientId: api.client_id,
    scheduledDeparture: new Date(api.scheduled_departure),
    scheduledArrival: api.scheduled_arrival
      ? new Date(api.scheduled_arrival)
      : null,
    actualDeparture: api.actual_departure
      ? new Date(api.actual_departure)
      : null,
    actualArrival: api.actual_arrival ? new Date(api.actual_arrival) : null,
    mileage: {
      start: api.start_mileage,
      end: api.end_mileage,
    },
    originAddress: api.origin_address,
    originCity: api.origin_city,
    originState: api.origin_state,
    destinationAddress: api.destination_address,
    destinationCity: api.destination_city,
    destinationState: api.destination_state,
    cargo: {
      description: api.cargo_description,
      weight: toNumber(api.cargo_weight),
      volume: toNumber(api.cargo_volume),
      units: api.cargo_units,
      value: toNumber(api.cargo_value),
    },
    costs: {
      baseRate: toNumberOrDefault(api.base_rate),
      fuelCost: toNumberOrDefault(api.fuel_cost),
      tollCost: toNumberOrDefault(api.toll_cost),
      otherCosts: toNumberOrDefault(api.other_costs),
      totalCost: toNumberOrDefault(api.total_cost),
    },
    status: api.status as TripStatusType,
    notes: api.notes,
    cancellationReason: api.cancellation_reason,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
    // Relaciones
    vehicle: api.vehicle
      ? {
          id: api.vehicle.id,
          unitNumber: api.vehicle.unit_number,
          licensePlate: api.vehicle.license_plate,
        }
      : undefined,
    driver: api.driver
      ? {
          id: api.driver.id,
          fullName: api.driver.full_name,
        }
      : undefined,
    client: api.client
      ? {
          id: api.client.id,
          legalName: api.client.legal_name,
        }
      : undefined,
    stops: api.stops?.map(mapTripStop),
    cargos: api.cargos?.map(mapTripCargo),
    expenses: api.expenses?.map(mapTripExpense),
    statusHistory: api.status_history?.map(mapStatusHistory),
  };
}

/**
 * Mapea parada
 */
export function mapTripStop(api: ApiStopResponse): TripStop {
  return {
    id: api.id,
    tripId: api.trip_id,
    sequenceOrder: api.sequence_order,
    stopType: api.stop_type,
    address: api.address,
    city: api.city,
    state: api.state,
    postalCode: api.postal_code,
    latitude: api.latitude,
    longitude: api.longitude,
    locationName: api.location_name,
    contactName: api.contact_name,
    contactPhone: api.contact_phone,
    estimatedArrival: api.estimated_arrival
      ? new Date(api.estimated_arrival)
      : null,
    actualArrival: api.actual_arrival ? new Date(api.actual_arrival) : null,
    notes: api.notes,
  };
}

/**
 * Mapea carga
 */
export function mapTripCargo(api: ApiTripCargoResponse): TripCargo {
  return {
    id: api.id,
    tripId: api.trip_id,
    clientId: api.client_id,
    description: api.description,
    productType: api.product_type,
    weight: api.weight,
    volume: api.volume,
    units: api.units,
    declaredValue: api.declared_value,
    rate: api.rate,
    currency: api.currency,
    status: api.status,
    notes: api.notes,
    specialInstructions: api.special_instructions,
    movements: api.movements?.map(mapCargoMovement),
  };
}

/**
 * Mapea movimiento de carga
 */
export function mapCargoMovement(api: ApiCargoMovementResponse): CargoMovement {
  return {
    id: api.id,
    cargoId: api.cargo_id,
    stopId: api.stop_id,
    stopIndex: api.stop_index,
    // movementType: api.movement_type as "pickup" | "delivery" | "transfer",
    movementType: api.movement_type,
    weight: api.weight,
    units: api.units,
    completedAt: api.completed_at ? new Date(api.completed_at) : null,
    notes: api.notes,
  };
}

/**
 * Mapea gasto
 */
export function mapTripExpense(api: ApiTripExpenseResponse): TripExpense {
  return {
    id: api.id,
    tripId: api.trip_id,
    category: api.category,
    description: api.description,
    amount: api.amount,
    currency: api.currency,
    expenseDate: new Date(api.expense_date),
    location: api.location,
    hasReceipt: api.has_receipt,
    receiptUrl: api.receipt_url,
    vendorName: api.vendor_name,
    isEstimated: api.is_estimated,
    status: api.status,
    notes: api.notes,
  };
}

/**
 * Mapea historial de estado
 */
export function mapStatusHistory(
  api: ApiStatusHistoryResponse,
): TripStatusHistory {
  return {
    id: api.id,
    tripId: api.trip_id,
    previousStatus: api.previous_status as TripStatusType | null,
    newStatus: api.new_status as TripStatusType,
    changedBy: api.changed_by,
    changedByName: api.changed_by_name,
    changedAt: new Date(api.changed_at),
    mileage: api.mileage,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    reason: api.reason,
  };
}

/**
 * Mapea respuesta del endpoint transaccional
 */
export function mapCreateTripResponse(
  response: ApiCreateTripResponse,
): CreateTripResult {
  return {
    trip: mapTrip(response.data.trip),
    summary: {
      tripId: response.data.summary.trip_id,
      tripCode: response.data.summary.trip_code,
      stopsCreated: response.data.summary.stops_created,
      cargosCreated: response.data.summary.cargos_created,
      expensesCreated: response.data.summary.expenses_created,
      finalStatus: response.data.summary.final_status,
    },
  };
}
