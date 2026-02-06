/**
 * Trip Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * ACTUALIZADO: Alineado con la estructura real del Backend
 *
 * Transforman datos entre el formato de la API y las entidades del dominio.
 * Esto mantiene el dominio independiente del formato de datos externo.
 */

import {
  type Trip,
  type TripListItem,
  type TripStop,
  type TripStatusHistory,
  type VehicleRef,
  type DriverRef,
  type ClientRef,
  type PaginatedList,
  type Pagination,
  type Mileage,
  type CargoInfo,
  type CostBreakdown,
  type TripStatusType,
  type StopTypeValue,
  type StopStatusValue,
  type CreateTripDTO,
  type CreateTripStopDTO,
  type CreateTripCargoDTO,
  type CreateTripExpenseDTO,
  type UpdateTripStatusDTO,
  type FinishTripDTO,
} from "@features/trips/domain";

// ============================================================================
// API RESPONSE TYPES - Estructura del Backend (snake_case)
// ============================================================================

/**
 * Respuesta de la API para un viaje en listado
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
 * Respuesta de la API para un viaje completo
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
  // Relaciones opcionales
  vehicle?: ApiVehicleResponse;
  driver?: ApiDriverResponse;
  client?: ApiClientResponse | null;
  stops?: ApiTripStopResponse[];
  status_history?: ApiStatusHistoryResponse[];
}

/**
 * Respuesta de vehículo de la API
 */
export interface ApiVehicleResponse {
  id: string;
  unit_number: string;
  license_plate: string;
}

/**
 * Respuesta de conductor de la API
 */
export interface ApiDriverResponse {
  id: string;
  full_name: string;
}

/**
 * Respuesta de cliente de la API
 */
export interface ApiClientResponse {
  id: string;
  legal_name: string;
}

/**
 * Respuesta de parada de la API
 */
export interface ApiTripStopResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  sequence_order: number;
  stop_type: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  location_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  estimated_departure: string | null;
  actual_departure: string | null;
  cargo_action_description: string | null;
  cargo_weight: string | number | null;
  cargo_units: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Respuesta de historial de estado de la API
 */
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
 * Respuesta paginada de la API
 */
export interface ApiPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API REQUEST TYPES - Estructura para enviar al Backend
// ============================================================================

/**
 * Request para crear un viaje
 */
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
  cargos?: ApiCreateCargoRequest[];
  expenses?: ApiCreateExpenseRequest[];
}

/**
 * Request para crear una parada
 */
export interface ApiCreateStopRequest {
  sequenceOrder: number;
  stopType: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedArrival?: string;
  cargoActionDescription?: string;
  cargoWeight?: number;
  cargoUnits?: number;
  notes?: string;
}

/**
 * Request para crear una carga
 */
export interface ApiCreateCargoRequest {
  clientId: string;
  description: string;
  productType?: string;
  weight?: number;
  volume?: number;
  units?: number;
  declaredValue?: number;
  rate: number;
  currency?: string;
  pickupStopIndex?: number;
  deliveryStopIndex?: number;
  notes?: string;
  specialInstructions?: string;
}

/**
 * Request para crear un gasto
 */
export interface ApiCreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  expenseDate?: string;
  location?: string;
  vendorName?: string;
  notes?: string;
  isEstimated?: boolean;
}

/**
 * Request para actualizar estado
 */
export interface ApiUpdateStatusRequest {
  status: string;
  mileage?: number;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

/**
 * Request para finalizar viaje
 */
export interface ApiFinishTripRequest {
  endMileage: number;
  actualArrival: string;
  fuelCost?: number;
  tollCost?: number;
  otherCosts?: number;
  notes?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convierte un valor a número de forma segura
 */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

/**
 * Convierte un valor a número con valor por defecto
 */
function toNumberOrDefault(
  value: string | number | null | undefined,
  defaultValue: number = 0,
): number {
  const num = toNumber(value);
  return num ?? defaultValue;
}

/**
 * Convierte una fecha de string a Date de forma segura
 */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convierte una fecha de string a Date (requerida)
 */
function toDateRequired(value: string): Date {
  return new Date(value);
}

/**
 * Convierte Date o string a string ISO
 */
function toISOString(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

/**
 * Convierte Date o string a string ISO (opcional)
 */
function toISOStringOptional(
  value: Date | string | undefined,
): string | undefined {
  if (!value) return undefined;
  return toISOString(value);
}

// ============================================================================
// MAPPERS - API Response to Domain Entity
// ============================================================================

/**
 * Mapea respuesta de vehículo de API a entidad de dominio
 */
export function mapVehicleRef(api: ApiVehicleResponse): VehicleRef {
  return {
    id: api.id,
    unitNumber: api.unit_number,
    licensePlate: api.license_plate,
  };
}

/**
 * Mapea respuesta de conductor de API a entidad de dominio
 */
export function mapDriverRef(api: ApiDriverResponse): DriverRef {
  return {
    id: api.id,
    fullName: api.full_name,
  };
}

/**
 * Mapea respuesta de cliente de API a entidad de dominio
 */
export function mapClientRef(api: ApiClientResponse): ClientRef {
  return {
    id: api.id,
    legalName: api.legal_name,
  };
}

/**
 * Mapea respuesta de parada de API a entidad de dominio
 */
export function mapTripStop(api: ApiTripStopResponse): TripStop {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    sequenceOrder: api.sequence_order,
    stopType: api.stop_type as StopTypeValue,
    address: api.address,
    city: api.city,
    state: api.state,
    postalCode: api.postal_code,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    locationName: api.location_name,
    contactName: api.contact_name,
    contactPhone: api.contact_phone,
    estimatedArrival: toDate(api.estimated_arrival),
    actualArrival: toDate(api.actual_arrival),
    estimatedDeparture: toDate(api.estimated_departure),
    actualDeparture: toDate(api.actual_departure),
    cargoActionDescription: api.cargo_action_description,
    cargoWeight: toNumber(api.cargo_weight),
    cargoUnits: api.cargo_units,
    status: api.status as StopStatusValue,
    notes: api.notes,
    createdAt: toDateRequired(api.created_at),
    updatedAt: toDateRequired(api.updated_at),
  };
}

/**
 * Mapea respuesta de historial de estado a entidad de dominio
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
    changedAt: toDateRequired(api.changed_at),
    mileage: api.mileage,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    reason: api.reason,
  };
}

/**
 * Mapea respuesta de item de lista a entidad de dominio
 */
export function mapTripListItem(api: ApiTripListItemResponse): TripListItem {
  const totalCost = toNumberOrDefault(api.total_cost);
  // Valores por defecto para campos nuevos (el backend puede no enviarlos aún)
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
    cargoCount: 0, // TODO: Agregar cuando el backend lo soporte
    clientCount: api.client_id ? 1 : 0,
    createdAt: toDateRequired(api.created_at),
  };
}

/**
 * Mapea respuesta de viaje completo de API a entidad de dominio
 */
export function mapTrip(api: ApiTripResponse): Trip {
  const mileage: Mileage = {
    start: api.start_mileage,
    end: api.end_mileage,
  };

  const cargo: CargoInfo = {
    description: api.cargo_description,
    weight: toNumber(api.cargo_weight),
    volume: toNumber(api.cargo_volume),
    units: api.cargo_units,
    value: toNumber(api.cargo_value),
  };

  const costs: CostBreakdown = {
    baseRate: toNumberOrDefault(api.base_rate),
    fuelCost: toNumberOrDefault(api.fuel_cost),
    tollCost: toNumberOrDefault(api.toll_cost),
    otherCosts: toNumberOrDefault(api.other_costs),
    totalCost: toNumberOrDefault(api.total_cost),
  };

  const trip: Trip = {
    id: api.id,
    tenantId: api.tenant_id,
    tripCode: api.trip_code,
    vehicleId: api.vehicle_id,
    driverId: api.driver_id,
    clientId: api.client_id,
    scheduledDeparture: toDateRequired(api.scheduled_departure),
    scheduledArrival: toDate(api.scheduled_arrival),
    actualDeparture: toDate(api.actual_departure),
    actualArrival: toDate(api.actual_arrival),
    mileage,
    originAddress: api.origin_address,
    originCity: api.origin_city,
    originState: api.origin_state,
    destinationAddress: api.destination_address,
    destinationCity: api.destination_city,
    destinationState: api.destination_state,
    cargo,
    costs,
    detailedCosts: null, // TODO: Agregar cuando el backend lo soporte
    profitability: null, // TODO: Agregar cuando el backend lo soporte
    status: api.status as TripStatusType,
    notes: api.notes,
    cancellationReason: api.cancellation_reason,
    createdAt: toDateRequired(api.created_at),
    updatedAt: toDateRequired(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
    // Relaciones opcionales
    vehicle: api.vehicle ? mapVehicleRef(api.vehicle) : undefined,
    driver: api.driver ? mapDriverRef(api.driver) : undefined,
    client: api.client ? mapClientRef(api.client) : undefined,
    stops: api.stops ? api.stops.map(mapTripStop) : undefined,
    statusHistory: api.status_history
      ? api.status_history.map(mapStatusHistory)
      : undefined,
  };

  return trip;
}

/**
 * Mapea respuesta paginada de API a formato de dominio (para listados)
 */
export function mapPaginatedTripListItems(
  api: ApiPaginatedResponse<ApiTripListItemResponse>,
): PaginatedList<TripListItem> {
  const pagination: Pagination = {
    page: api.pagination.page,
    limit: api.pagination.limit,
    total: api.pagination.total,
    totalPages: api.pagination.totalPages,
  };

  return {
    items: api.data.map(mapTripListItem),
    pagination,
  };
}

/**
 * Mapea respuesta paginada de viajes completos
 */
export function mapPaginatedTrips(
  api: ApiPaginatedResponse<ApiTripResponse>,
): PaginatedList<Trip> {
  const pagination: Pagination = {
    page: api.pagination.page,
    limit: api.pagination.limit,
    total: api.pagination.total,
    totalPages: api.pagination.totalPages,
  };

  return {
    items: api.data.map(mapTrip),
    pagination,
  };
}

// ============================================================================
// REVERSE MAPPERS - Domain to API Request
// ============================================================================

/**
 * Prepara datos de creación de viaje para API
 */
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
    cargos: data.cargos?.map(toApiCreateCargo),
    expenses: data.expenses?.map(toApiCreateExpense),
  };
}

/**
 * Prepara datos de creación de parada para API
 */
export function toApiCreateStop(data: CreateTripStopDTO): ApiCreateStopRequest {
  return {
    sequenceOrder: data.sequenceOrder,
    stopType: data.stopType,
    address: data.address,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    latitude: data.latitude,
    longitude: data.longitude,
    locationName: data.locationName,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    estimatedArrival: toISOStringOptional(data.estimatedArrival),
    cargoActionDescription: data.cargoActionDescription,
    cargoWeight: data.cargoWeight,
    cargoUnits: data.cargoUnits,
    notes: data.notes,
  };
}

/**
 * Prepara datos de actualización de estado para API
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

/**
 * Prepara datos de creación de carga para API
 */
export function toApiCreateCargo(
  data: CreateTripCargoDTO,
): ApiCreateCargoRequest {
  return {
    clientId: data.clientId,
    description: data.description,
    productType: data.productType,
    weight: data.weight,
    volume: data.volume,
    units: data.units,
    declaredValue: data.declaredValue,
    rate: data.rate,
    currency: data.currency,
    pickupStopIndex: data.pickupStopIndex,
    deliveryStopIndex: data.deliveryStopIndex,
    notes: data.notes,
    specialInstructions: data.specialInstructions,
  };
}

/**
 * Prepara datos de creación de gasto para API
 */
export function toApiCreateExpense(
  data: CreateTripExpenseDTO,
): ApiCreateExpenseRequest {
  return {
    category: data.category,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    expenseDate: toISOStringOptional(data.expenseDate),
    location: data.location,
    vendorName: data.vendorName,
    notes: data.notes,
    isEstimated: data.isEstimated,
  };
}

/**
 * Prepara datos de finalización de viaje para API
 */
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
