/**
 * Trip Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define las interfaces que la capa de infraestructura debe implementar.
 * Esto permite que el dominio no dependa de detalles de implementación.
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
} from "./entities";

// ============================================================================
// DTOs - Data Transfer Objects para Trip
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
// DTOs - Data Transfer Objects para Stop
// ============================================================================

/**
 * DTO para crear una parada
 */
export interface CreateTripStopDTO {
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
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ITripRepository {
  /**
   * Obtiene todos los viajes con filtros y paginación
   */
  findAll(params?: TripQueryParams): Promise<PaginatedList<TripListItem>>;

  /**
   * Obtiene un viaje por su ID
   */
  findById(id: string): Promise<Trip | null>;

  /**
   * Crea un nuevo viaje
   */
  create(data: CreateTripDTO): Promise<Trip>;

  /**
   * Actualiza un viaje existente
   */
  update(id: string, data: UpdateTripDTO): Promise<Trip>;

  /**
   * Actualiza el estado de un viaje
   */
  updateStatus(id: string, data: UpdateTripStatusDTO): Promise<Trip>;

  /**
   * Finaliza un viaje
   */
  finish(id: string, data: FinishTripDTO): Promise<Trip>;

  /**
   * Elimina un viaje
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un viaje con el código dado
   */
  existsByCode(code: string): Promise<boolean>;
}

/**
 * Interfaz del repositorio de paradas
 * Define las operaciones disponibles sin detalles de implementación
 */
export interface IStopRepository {
  /**
   * Obtiene todas las paradas de un viaje
   */
  findByTripId(tripId: string): Promise<TripStop[]>;

  /**
   * Obtiene una parada por su ID
   */
  findById(tripId: string, stopId: string): Promise<TripStop | null>;

  /**
   * Agrega una nueva parada a un viaje
   */
  add(tripId: string, data: AddStopData): Promise<TripStop>;

  /**
   * Actualiza una parada existente
   */
  update(
    tripId: string,
    stopId: string,
    data: Partial<CreateTripStopDTO>,
  ): Promise<TripStop>;

  /**
   * Elimina una parada
   */
  delete(tripId: string, stopId: string): Promise<void>;

  /**
   * Reordena las paradas de un viaje
   */
  reorder(tripId: string, orderedIds: string[]): Promise<TripStop[]>;

  /**
   * Marca una parada como visitada
   */
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
  /**
   * Notificar cambio de estado de viaje
   */
  notifyStatusChange(trip: Trip, previousStatus: TripStatusType): Promise<void>;

  /**
   * Notificar nuevo viaje creado
   */
  notifyTripCreated(trip: Trip): Promise<void>;

  /**
   * Notificar viaje cancelado
   */
  notifyTripCancelled(trip: Trip, reason?: string): Promise<void>;
}

/**
 * Interfaz para servicio de geolocalización
 */
export interface IGeolocationService {
  /**
   * Obtiene la distancia entre dos coordenadas
   */
  calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ): number;

  /**
   * Obtiene la ubicación actual
   */
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }>;

  /**
   * Geocodifica una dirección
   */
  geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>;
}
