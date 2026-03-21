/**
 * Trip Domain Repositories
 * Clean Architecture - Domain Layer (Ports)
 *
 * Interfaces que definen los contratos de los repositorios.
 * Las implementaciones están en Infrastructure.
 *
 * Ubicación: src/features/trips/domain/repositories.ts
 */

import type { MappedActionResult, MappedSingleResult } from "@shared/api";
import type {
  Trip,
  TripListItem,
  // TripStop,
  TripCargo,
  TripExpense,
  CargoMovement,
  ExpensesSummary,
  TripStop,
} from "./entities";
import type {
  CreateTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
  FinishTripInput,
  // CreateStopInput,
  // UpdateStopInput,
  CreateCargoInput,
  UpdateCargoInput,
  CreateCargoMovementInput,
  CompleteCargoMovementInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaginatedResult,
  CreateStopInput,
  UpdateStopInput,
} from "./inputs";
import type { TripQueryParams } from "./queries";

// ============================================================================
// TRIP REPOSITORY
// ============================================================================

/**
 * Interfaz del repositorio de viajes
 */
export interface ITripRepository {
  /**
   * Lista viajes con filtros y paginación
   */
  findAll(params?: TripQueryParams): Promise<PaginatedResult<TripListItem>>;

  /**
   * Obtiene un viaje por ID con todas sus relaciones
   */
  findById(id: string): Promise<MappedSingleResult<Trip> | null>;

  /**
   * Crea un viaje completo con paradas, cargas y gastos
   * (Endpoint transaccional POST /trips/with-details)
   */
  create(input: CreateTripInput): Promise<{
    trip: Trip;
    summary: {
      tripId: string;
      tripCode: string;
      stopsCreated: number;
      cargosCreated: number;
      expensesCreated: number;
      finalStatus: string;
    };
  }>;

  /**
   * Actualiza un viaje existente
   */
  update(id: string, input: UpdateTripInput): Promise<MappedSingleResult<Trip>>;

  /**
   * Actualiza el estado de un viaje
   */
  updateStatus(
    id: string,
    input: UpdateTripStatusInput,
  ): Promise<MappedSingleResult<Trip>>;

  /**
   * Finaliza un viaje
   */
  finish(id: string, input: FinishTripInput): Promise<MappedSingleResult<Trip>>;

  /**
   * Elimina un viaje (solo drafts)
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un viaje con el código dado
   */
  existsByCode(code: string): Promise<boolean>;
}

// ============================================================================
// STOP REPOSITORY  // FALTA IMPLEMENTARLO EN EL BACKEND
// ============================================================================

/**
 * Interfaz del repositorio de paradas
 */
export interface IStopRepository {
  /**
   * Obtiene todas las paradas de un viaje
   */
  findByTripId(tripId: string): Promise<MappedSingleResult<TripStop[]>>;

  /**
   * Obtiene una parada por ID
   */
  findById(
    tripId: string,
    stopId: string,
  ): Promise<MappedSingleResult<TripStop> | null>;

  /**
   * Agrega una parada a un viaje
   */
  add(
    tripId: string,
    input: CreateStopInput,
  ): Promise<MappedSingleResult<TripStop>>;

  /**
   * Actualiza una parada
   */
  update(
    tripId: string,
    stopId: string,
    input: UpdateStopInput,
  ): Promise<MappedSingleResult<TripStop>>;

  /**
   * Elimina una parada
   */
  delete(tripId: string, stopId: string): Promise<void>;

  /**
   * Reordena las paradas de un viaje
   */
  reorder(
    tripId: string,
    orderedIds: string[],
  ): Promise<MappedSingleResult<TripStop[]>>;

  /**
   * Marca una parada como visitada
   */
  markVisited(
    tripId: string,
    stopId: string,
    actualArrival: Date,
  ): Promise<MappedSingleResult<TripStop>>;
}

// ============================================================================
// CARGO REPOSITORY
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
    input: UpdateCargoInput,
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
    input: CreateCargoMovementInput,
  ): Promise<MappedSingleResult<CargoMovement>>;

  /**
   * Marca un movimiento como completado
   */
  completeMovement(
    tripId: string,
    cargoId: string,
    movementId: string,
    input?: CompleteCargoMovementInput,
  ): Promise<MappedSingleResult<CargoMovement>>;
}

// ============================================================================
// EXPENSE REPOSITORY
// ============================================================================

/**
 * Interfaz del repositorio de gastos
 */
export interface IExpenseRepository {
  /**
   * Obtiene todos los gastos de un viaje
   */
  findByTripId(tripId: string): Promise<MappedSingleResult<TripExpense[]>>;

  /**
   * Obtiene el resumen de gastos de un viaje
   */
  getSummary(tripId: string): Promise<MappedSingleResult<ExpensesSummary>>;

  /**
   * Obtiene un gasto por ID
   */
  findById(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense | null>>;

  /**
   * Agrega un gasto a un viaje
   */
  create(
    tripId: string,
    input: CreateExpenseInput,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Actualiza un gasto
   */
  update(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Elimina un gasto
   */
  delete(tripId: string, expenseId: string): Promise<MappedActionResult>;

  /**
   * Aprueba un gasto
   */
  approve(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Rechaza un gasto
   */
  reject(
    tripId: string,
    expenseId: string,
    reason?: string,
  ): Promise<MappedSingleResult<TripExpense>>;
}
