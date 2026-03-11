/**
 * Trip Repository Interface
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define el contrato del repositorio de viajes.
 * La implementación está en Infrastructure.
 *
 * Ubicación: src/features/trips/domain/repositories/ITripRepository.ts
 */

import type {
  Trip,
  TripListItem,
  TripQueryParams,
} from "@features/trips/domain";
import type {
  CreateTripInput,
  CreateTripResult,
} from "@features/trips/application/useCases/trip/CreateTripUseCase";
import type {
  FinishTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "@features/trips/application";

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface ITripRepository {
  /**
   * Lista viajes con filtros y paginación
   */
  findAll(params?: TripQueryParams): Promise<PaginatedResult<TripListItem>>;

  /**
   * Obtiene un viaje por ID
   */
  findById(id: string): Promise<Trip | null>;

  /**
   * Crea un viaje completo con paradas, cargas y gastos
   * (Endpoint transaccional POST /trips/with-details)
   *
   * El Input va en camelCase, el apiClient convierte automáticamente a snake_case
   */
  create(input: CreateTripInput): Promise<CreateTripResult>;

  /**
   * Actualiza un viaje existente
   */
  update(id: string, input: UpdateTripInput): Promise<Trip>;

  /**
   * Actualiza el estado de un viaje
   */
  updateStatus(id: string, input: UpdateTripStatusInput): Promise<Trip>;

  /**
   * Finaliza un viaje
   */
  finish(id: string, input: FinishTripInput): Promise<Trip>;

  /**
   * Elimina un viaje (solo drafts)
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un viaje con el código dado
   */
  existsByCode(code: string): Promise<boolean>;
}
