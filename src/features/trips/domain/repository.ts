/**
 * Trip Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * ACTUALIZADO: Modelo Carga → Movimientos
 * - CreateTripCargoDTO usa movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - CreateCargoMovementDTO define pickup/delivery parciales
 *
 * Patrón: Ports & Adapters (Hexagonal Architecture)
 */

import type {
  Trip,
  TripListItem,
  TripStop,
  TripStatusType,
  TripQueryParams,
  PaginatedList,
  StopTypeValue,
  CargoMovementTypeValue,
} from "./entities";

// ============================================================================
// DTOs - Cargo Movements
// ============================================================================

/**
 * DTO para crear un movimiento de carga (pickup o delivery parcial/total)
 *
 * - pickup:  la mercancía se recoge en la parada indicada por stopIndex
 * - delivery: la mercancía (parcial o total) se entrega en la parada indicada
 */
export interface CreateCargoMovementDTO {
  stopIndex: number;
  movementType: CargoMovementTypeValue;
  weight?: number;
  units?: number;
  notes?: string;
}

// ============================================================================
// DTOs - Trip
// ============================================================================

/**
 * DTO para crear un viaje
 * NOTA: tripCode NO se incluye porque el backend lo genera automáticamente
 */
export interface CreateTripDTO {
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
  stops?: CreateTripStopDTO[];
  cargos?: CreateTripCargoDTO[];
  expenses?: CreateTripExpenseDTO[];
}

/**
 * DTO para crear una carga
 * Usa movements[] para conectar carga con paradas (pickup/delivery parcial).
 */
export interface CreateTripCargoDTO {
  clientId: string;
  description: string;
  productType?: string;
  weight?: number;
  volume?: number;
  units?: number;
  declaredValue?: number;
  rate: number;
  currency?: string;
  movements: CreateCargoMovementDTO[];
  notes?: string;
  specialInstructions?: string;
}

/**
 * Categoría de gasto
 */
export type ExpenseCategoryValue =
  | "fuel"
  | "tolls"
  | "driver_allowance"
  | "lodging"
  | "loading_unloading"
  | "parking"
  | "maintenance"
  | "insurance"
  | "permits"
  | "other";

/**
 * DTO para crear un gasto
 */
export interface CreateTripExpenseDTO {
  category: ExpenseCategoryValue;
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
 * DTO para actualizar un viaje
 */
export interface UpdateTripDTO {
  vehicleId?: string;
  driverId?: string;
  clientId?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  startMileage?: number;
  originAddress?: string;
  originCity?: string;
  originState?: string;
  destinationAddress?: string;
  destinationCity?: string;
  destinationState?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  cargoUnits?: number;
  cargoValue?: number;
  baseRate?: number;
  notes?: string;
}

/**
 * DTO para actualizar el estado de un viaje
 */
export interface UpdateTripStatusDTO {
  status: TripStatusType;
  mileage?: number;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

/**
 * DTO para finalizar un viaje
 */
export interface FinishTripDTO {
  endMileage: number;
  actualArrival: string;
  fuelCost?: number;
  tollCost?: number;
  otherCosts?: number;
  notes?: string;
}

// ============================================================================
// DTOs - Stop
// ============================================================================

/**
 * DTO para crear una parada
 */
export interface CreateTripStopDTO {
  sequenceOrder: number;
  stopType: StopTypeValue | StopTypeValue[];
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedArrival?: string | Date | undefined;
  cargoActionDescription?: string;
  cargoWeight?: number;
  cargoUnits?: number;
  notes?: string;
}

/**
 * Datos para agregar una parada (usado en casos de uso)
 */
export interface AddStopData {
  sequenceOrder: number;
  stopType: StopTypeValue;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedArrival?: Date | string;
  cargoActionDescription?: string;
  cargoWeight?: number;
  cargoUnits?: number;
  notes?: string;
}

/**
 * DTO para actualizar una parada
 */
export interface UpdateStopDTO {
  sequenceOrder?: number;
  stopType?: StopTypeValue;
  address?: string;
  city?: string;
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

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de viajes
 */
export interface ITripRepository {
  findAll(params?: TripQueryParams): Promise<PaginatedList<TripListItem>>;
  findById(id: string): Promise<Trip | null>;
  create(data: CreateTripDTO): Promise<Trip>;
  update(id: string, data: UpdateTripDTO): Promise<Trip>;
  updateStatus(id: string, data: UpdateTripStatusDTO): Promise<Trip>;
  finish(id: string, data: FinishTripDTO): Promise<Trip>;
  delete(id: string): Promise<void>;
  existsByCode(code: string): Promise<boolean>;
}

/**
 * Interfaz del repositorio de paradas
 */
export interface IStopRepository {
  findByTripId(tripId: string): Promise<TripStop[]>;
  findById(tripId: string, stopId: string): Promise<TripStop | null>;
  add(tripId: string, data: AddStopData): Promise<TripStop>;
  update(
    tripId: string,
    stopId: string,
    data: Partial<CreateTripStopDTO>,
  ): Promise<TripStop>;
  delete(tripId: string, stopId: string): Promise<void>;
  reorder(tripId: string, orderedIds: string[]): Promise<TripStop[]>;
  markVisited(
    tripId: string,
    stopId: string,
    actualArrival: Date,
  ): Promise<TripStop>;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Interfaz para servicio de notificaciones
 */
export interface INotificationService {
  notifyStatusChange(trip: Trip, previousStatus: TripStatusType): Promise<void>;
  notifyTripCreated(trip: Trip): Promise<void>;
  notifyTripCancelled(trip: Trip, reason?: string): Promise<void>;
}

/**
 * Interfaz para servicio de geolocalización
 */
export interface IGeolocationService {
  calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ): number;
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }>;
  geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>;
}
