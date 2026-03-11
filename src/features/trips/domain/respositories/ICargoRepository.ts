/**
 * Trip Cargo Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * Interfaces para los repositorios de cargas y gastos.
 * Implementa el Enfoque B: operaciones separadas del viaje principal.
 */

import type { MappedActionResult, MappedSingleResult } from "@shared/api";
import type {
  TripCargo,
  CargoMovement,
  CargoStatusType,
} from "../entities/entities";
import type {
  CreateCargoInput,
  CreateCargoMovementInput,
} from "@features/trips/application";

// ============================================================================
// CARGO DTOs
// ============================================================================

/**
 * DTO para actualizar una carga
 */
export interface UpdateCargoDTO {
  description?: string;
  productType?: string | null;
  weight?: number | null;
  volume?: number | null;
  units?: number | null;
  declaredValue?: number | null;
  rate?: number;
  currency?: string;
  pickupStopId?: string | null;
  deliveryStopId?: string | null;
  notes?: string | null;
  specialInstructions?: string | null;
  status?: CargoStatusType;

  // Carta Porte 3.1
  satProductCode?: string | null;
  satUnitCode?: string | null;
  satUnitName?: string | null;
  weightInKg?: number | null;
  dimensions?: string | null;
  hazardousMaterial?: boolean | null;
  hazardousMaterialCode?: string | null;
  packagingType?: string | null;
  packagingDescription?: string | null;
}

/**
 * DTO para completar un movimiento de carga
 */
export interface CompleteCargoMovementDTO {
  completedAt?: string;
  notes?: string;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de cargas
 */
export interface ICargoRepository {
  /**
   * Obtiene todas las cargas de un viaje
   */
  findByTripId(tripId: string): Promise<MappedSingleResult<TripCargo[]>>;

  /**
   * Obtiene una carga por ID
   */
  findById(
    tripId: string,
    cargoId: string,
  ): Promise<MappedSingleResult<TripCargo | null>>;

  /**
   * Agrega una carga a un viaje
   */
  create(
    tripId: string,
    input: CreateCargoInput,
  ): Promise<MappedSingleResult<TripCargo>>;

  /**
   * Actualiza una carga
   */
  update(
    tripId: string,
    cargoId: string,
    data: UpdateCargoDTO,
  ): Promise<MappedSingleResult<TripCargo>>;

  /**
   * Elimina una carga
   */
  delete(tripId: string, cargoId: string): Promise<MappedActionResult>;

  /**
   * Agrega un movimiento a una carga
   */
  addMovement(
    tripId: string,
    cargoId: string,
    data: CreateCargoMovementInput,
  ): Promise<MappedSingleResult<CargoMovement>>;

  /**
   * Marca un movimiento como completado
   */
  completeMovement(
    tripId: string,
    cargoId: string,
    movementId: string,
    data?: CompleteCargoMovementDTO,
  ): Promise<MappedSingleResult<CargoMovement>>;
}
