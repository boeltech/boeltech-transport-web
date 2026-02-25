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
  MappedActionResult,
  MappedPaginatedResult,
  MappedSingleResult,
} from "@shared/api";
import type {
  Trip,
  TripListItem,
  TripStatusType,
  TripQueryParams,
} from "./entities";
import type { CreateTripStopDTO } from "./stopRepositoryInterfaces";

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
  // cargos?: CreateTripCargoDTO[];
  // expenses?: CreateTripExpenseDTO[];
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
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de viajes
 */
export interface ITripRepository {
  findAll(
    params?: TripQueryParams,
  ): Promise<MappedPaginatedResult<TripListItem>>;
  findById(id: string): Promise<MappedSingleResult<Trip | null>>;
  create(data: CreateTripDTO): Promise<MappedSingleResult<Trip>>;
  update(id: string, data: UpdateTripDTO): Promise<MappedSingleResult<Trip>>;
  updateStatus(
    id: string,
    data: UpdateTripStatusDTO,
  ): Promise<MappedSingleResult<Trip>>;
  finish(id: string, data: FinishTripDTO): Promise<MappedSingleResult<Trip>>;
  delete(id: string): Promise<MappedActionResult>;
  existsByCode(code: string): Promise<boolean>;
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
