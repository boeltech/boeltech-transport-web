/**
 * Trip Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * ACTUALIZADO: Modelo Carga → Movimientos + Cargos y Expenses Response
 * - ApiCreateCargoRequest ahora envía movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - toApiCreateCargo mapea movements correctamente
 * - ApiTripCargoResponse y ApiTripExpenseResponse agregados para recibir datos del backend
 * - mapTripCargo y mapTripExpense agregan transformación API → Domain
 *
 * Transforman datos entre el formato de la API y las entidades del dominio.
 */

import {
  type Trip,
  type TripListItem,
  type TripStatusHistory,
  type VehicleRef,
  type DriverRef,
  type ClientRef,
  type Mileage,
  type CargoInfo,
  type CostBreakdown,
  type TripStatusType,
} from "@features/trips/domain/entities";

import {
  type CreateTripDTO,
  type UpdateTripStatusDTO,
  type FinishTripDTO,
} from "@features/trips/domain";
import {
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedPaginatedResult,
  type MappedSingleResult,
  type Pagination,
} from "@shared/api";
import {
  toDate,
  toDateRequired,
  toISOString,
  toISOStringOptional,
} from "@shared/utils/dateHelpers";
import { toNumber, toNumberOrDefault } from "@shared/utils/numberHelpers";
import {
  mapTripStop,
  toApiCreateStop,
  type ApiCreateStopRequest,
  type ApiTripStopResponse,
} from "./stopMappers";

// ============================================================================
// API RESPONSE TYPES - Estructura del Backend (snake_case)
// ============================================================================

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
  vehicle?: ApiVehicleResponse;
  driver?: ApiDriverResponse;
  client?: ApiClientResponse | null;
  stops?: ApiTripStopResponse[];
  status_history?: ApiStatusHistoryResponse[];
  //   cargos?: ApiTripCargoResponse[];
  //   expenses?: ApiTripExpenseResponse[];
}

export interface ApiVehicleResponse {
  id: string;
  unit_number: string;
  license_plate: string;
}

export interface ApiDriverResponse {
  id: string;
  full_name: string;
}

export interface ApiClientResponse {
  id: string;
  legal_name: string;
}

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

// ============================================================================
// API REQUEST TYPES - Estructura para enviar al Backend
// ============================================================================

export interface ApiCreateTripRequest {
  vehicleId: string;
  driverId: string;
  clientId?: string;
  scheduledDeparture: string;
  scheduledArrival?: string;
  startMileage?: number;
  originAddress: string;
  originCity: string;
  originState?: string;
  destinationAddress: string;
  destinationCity: string;
  destinationState?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  cargoUnits?: number;
  cargoValue?: number;
  baseRate?: number;
  notes?: string;
  stops?: ApiCreateStopRequest[];
  //   cargos?: ApiCreateCargoRequest[];
  //   expenses?: ApiCreateExpenseRequest[];
}

export interface ApiUpdateStatusRequest {
  status: string;
  mileage?: number;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

export interface ApiFinishTripRequest {
  endMileage: number;
  actualArrival: string;
  fuelCost?: number;
  tollCost?: number;
  otherCosts?: number;
  notes?: string;
}

// ============================================================================
// MAPPERS - API Response to Domain Entity
// ============================================================================

export function mapVehicleRef(api: ApiVehicleResponse): VehicleRef {
  return {
    id: api.id,
    unitNumber: api.unit_number,
    licensePlate: api.license_plate,
  };
}

export function mapDriverRef(api: ApiDriverResponse): DriverRef {
  return {
    id: api.id,
    fullName: api.full_name,
  };
}

export function mapClientRef(api: ApiClientResponse): ClientRef {
  return {
    id: api.id,
    legalName: api.legal_name,
  };
}

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
    changedAt: toDateRequired(api.changed_at),
    mileage: api.mileage,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    reason: api.reason,
  };
}

// ============================================================================
// COMPOSITE MAPPERS - Full Trip with relations
// ============================================================================

export function mapTripListItem(api: ApiTripListItemResponse): TripListItem {
  const totalCost = toNumberOrDefault(api.total_cost);
  const totalRevenue = 0; // TODO: Agregar cuando el backend lo soporte
  const estimatedProfit = totalRevenue - totalCost;

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
    scheduledDeparture: toDateRequired(api.scheduled_departure),
    scheduledArrival: toDate(api.scheduled_arrival),
    status: api.status as TripStatusType,
    cargoDescription: api.cargo_description,
    totalCost,
    totalRevenue,
    estimatedProfit,
    cargoCount: 0,
    clientCount: api.client_id ? 1 : 0,
    createdAt: toDateRequired(api.created_at),
  };
}

export function mapTrip(
  api: ApiSingleResponse<ApiTripResponse>,
): MappedSingleResult<Trip> {
  const mileage: Mileage = {
    start: api.data.start_mileage,
    end: api.data.end_mileage,
  };

  const cargo: CargoInfo = {
    description: api.data.cargo_description,
    weight: toNumber(api.data.cargo_weight),
    volume: toNumber(api.data.cargo_volume),
    units: api.data.cargo_units,
    value: toNumber(api.data.cargo_value),
  };

  const costs: CostBreakdown = {
    baseRate: toNumberOrDefault(api.data.base_rate),
    fuelCost: toNumberOrDefault(api.data.fuel_cost),
    tollCost: toNumberOrDefault(api.data.toll_cost),
    otherCosts: toNumberOrDefault(api.data.other_costs),
    totalCost: toNumberOrDefault(api.data.total_cost),
  };

  const trip: Trip = {
    id: api.data.id,
    tenantId: api.data.tenant_id,
    tripCode: api.data.trip_code,
    vehicleId: api.data.vehicle_id,
    driverId: api.data.driver_id,
    clientId: api.data.client_id,
    scheduledDeparture: toDateRequired(api.data.scheduled_departure),
    scheduledArrival: toDate(api.data.scheduled_arrival),
    actualDeparture: toDate(api.data.actual_departure),
    actualArrival: toDate(api.data.actual_arrival),
    mileage,
    originAddress: api.data.origin_address,
    originCity: api.data.origin_city,
    originState: api.data.origin_state,
    destinationAddress: api.data.destination_address,
    destinationCity: api.data.destination_city,
    destinationState: api.data.destination_state,
    cargo,
    costs,
    detailedCosts: null,
    profitability: null,
    status: api.data.status as TripStatusType,
    notes: api.data.notes,
    cancellationReason: api.data.cancellation_reason,
    createdAt: toDateRequired(api.data.created_at),
    updatedAt: toDateRequired(api.data.updated_at),
    createdBy: api.data.created_by,
    updatedBy: api.data.updated_by,
    vehicle: api.data.vehicle ? mapVehicleRef(api.data.vehicle) : undefined,
    driver: api.data.driver ? mapDriverRef(api.data.driver) : undefined,
    client: api.data.client ? mapClientRef(api.data.client) : undefined,
    stops: api.data.stops ? api.data.stops.map(mapTripStop) : undefined,
    statusHistory: api.data.status_history
      ? api.data.status_history.map(mapStatusHistory)
      : undefined,
    // cargos: api.data.cargos ? api.data.cargos.map(mapTripCargo) : undefined,
    // expenses: api.data.expenses
    //   ? api.data.expenses.map(mapTripExpense)
    //   : undefined,
  };

  return {
    data: trip,
    message: api.message,
  };
}

export function mapPaginatedTripListItems(
  api: ApiPaginatedResponse<ApiTripListItemResponse>,
): MappedPaginatedResult<TripListItem> {
  const pagination: Pagination = {
    page: api.pagination.page,
    limit: api.pagination.limit,
    total: api.pagination.total,
    totalPages: api.pagination.totalPages,
  };

  return {
    data: api.data.map(mapTripListItem),
    pagination,
  };
}

// export function mapPaginatedTrips(
//   api: ApiPaginatedResponse<ApiTripResponse>,
// ): MappedPaginatedResult<Trip> {
//   const pagination: Pagination = {
//     page: api.pagination.page,
//     limit: api.pagination.limit,
//     total: api.pagination.total,
//     totalPages: api.pagination.totalPages,
//   };

//   return {
//     data: api.data.map(mapTrip),
//     pagination,
//   };
// }

// ============================================================================
// REVERSE MAPPERS - Domain to API Request
// ============================================================================

export function toApiCreateTrip(data: CreateTripDTO): ApiCreateTripRequest {
  return {
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    clientId: data.clientId,
    scheduledDeparture: toISOString(data.scheduledDeparture),
    scheduledArrival: toISOStringOptional(data.scheduledArrival),
    startMileage: data.startMileage,
    originAddress: data.originAddress,
    originCity: data.originCity,
    originState: data.originState,
    destinationAddress: data.destinationAddress,
    destinationCity: data.destinationCity,
    destinationState: data.destinationState,
    cargoDescription: data.cargoDescription,
    cargoWeight: data.cargoWeight,
    cargoVolume: data.cargoVolume,
    cargoUnits: data.cargoUnits,
    cargoValue: data.cargoValue,
    baseRate: data.baseRate,
    notes: data.notes,
    stops: data.stops?.map(toApiCreateStop),
    // cargos: data.cargos?.map(toApiCreateCargo),
    // expenses: data.expenses?.map(toApiCreateExpense),
  };
}

/**
 * Prepara datos de creación de carga para API
 * ACTUALIZADO: Envía movements[] en lugar de pickupStopIndex/deliveryStopIndex
 */

export function toApiUpdateStatus(
  data: UpdateTripStatusDTO,
): ApiUpdateStatusRequest {
  return {
    status: data.status,
    mileage: data.mileage,
    latitude: data.latitude,
    longitude: data.longitude,
    reason: data.reason,
  };
}

export function toApiFinishTrip(data: FinishTripDTO): ApiFinishTripRequest {
  return {
    endMileage: data.endMileage,
    actualArrival: toISOString(data.actualArrival),
    fuelCost: data.fuelCost,
    tollCost: data.tollCost,
    otherCosts: data.otherCosts,
    notes: data.notes,
  };
}
