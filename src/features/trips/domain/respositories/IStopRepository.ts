/**
 * Stop Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * ACTUALIZADO: Modelo Carga → Movimientos
 * - CreateTripCargoDTO usa movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - CreateCargoMovementDTO define pickup/delivery parciales
 *
 * Patrón: Ports & Adapters (Hexagonal Architecture)
 */

import type { CreateStopInput } from "@features/trips/application";
import type { TripStop, StopTypeValue } from "../entities/entities";

// ============================================================================
// DTOs - Stop
// ============================================================================

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

  // Carta Porte 3.1
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  colonia?: string;
  reference?: string;
  satEstadoCode?: string;
  satMunicipioCode?: string;
  satLocalidadCode?: string;
  satColoniaCode?: string;
  rfcRemitenteDestinatario?: string;
  distanceToNextKm?: number;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de paradas
 */
export interface IStopRepository {
  findByTripId(tripId: string): Promise<TripStop[]>;
  findById(tripId: string, stopId: string): Promise<TripStop | null>;
  add(tripId: string, data: CreateStopInput): Promise<TripStop>;
  update(
    tripId: string,
    stopId: string,
    data: Partial<CreateStopInput>,
  ): Promise<TripStop>;
  delete(tripId: string, stopId: string): Promise<void>;
  reorder(tripId: string, orderedIds: string[]): Promise<TripStop[]>;
  markVisited(
    tripId: string,
    stopId: string,
    actualArrival: Date,
  ): Promise<TripStop>;
}
