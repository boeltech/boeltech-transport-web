/**
 * Trip Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa ITripRepository usando HTTP/REST.
 *
 * PATRÓN:
 * - Recibe Input en camelCase
 * - apiClient convierte automáticamente a snake_case
 * - Mappers convierten Response (snake_case) → Entity (camelCase)
 *
 * Ubicación: src/features/trips/infrastructure/repositories/TripRepository.ts
 */

import { apiClient, type ApiPaginatedResponse } from "@shared/api";
import type { ITripRepository, PaginatedResult } from "@features/trips/domain";
import type {
  Trip,
  TripListItem,
  TripQueryParams,
} from "@features/trips/domain";
import type {
  CreateTripInput,
  CreateTripResult,
} from "@features/trips/application/useCases/trip/CreateTripUseCase";
import {
  mapTrip,
  mapTripListItem,
  mapCreateTripResponse,
  type ApiTripResponse,
  type ApiTripListItemResponse,
  type ApiCreateTripResponse,
} from "../mappers/tripMappers";
import type {
  FinishTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "@features/trips/application";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIPS_ENDPOINT = "/trips";

// ============================================================================
// REPOSITORY IMPLEMENTATION
// ============================================================================

export class TripRepository implements ITripRepository {
  /**
   * Lista viajes con filtros y paginación
   */
  async findAll(
    params?: TripQueryParams,
  ): Promise<PaginatedResult<TripListItem>> {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiTripListItemResponse>
    >(TRIPS_ENDPOINT, { params: this.buildQueryParams(params) });

    return {
      data: response.data.map(mapTripListItem),
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      },
    };
  }

  /**
   * Obtiene un viaje por ID
   */
  async findById(id: string): Promise<Trip | null> {
    try {
      const response = await apiClient.get<{ data: ApiTripResponse }>(
        `${TRIPS_ENDPOINT}/${id}`,
      );
      return mapTrip(response.data);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Crea un viaje completo con paradas, cargas y gastos
   *
   * El Input va en camelCase, apiClient.post() convierte automáticamente
   * a snake_case con deepToSnake()
   */
  async create(input: CreateTripInput): Promise<CreateTripResult> {
    const response = await apiClient.post<ApiCreateTripResponse>(
      TRIPS_ENDPOINT,
      input, // ← camelCase, se convierte automáticamente a snake_case
    );

    return mapCreateTripResponse(response);
  }

  /**
   * Actualiza un viaje existente
   */
  async update(id: string, input: UpdateTripInput): Promise<Trip> {
    const response = await apiClient.put<{ data: ApiTripResponse }>(
      `${TRIPS_ENDPOINT}/${id}`,
      input, // ← camelCase, se convierte automáticamente
    );

    return mapTrip(response.data);
  }

  /**
   * Actualiza el estado de un viaje
   */
  async updateStatus(id: string, input: UpdateTripStatusInput): Promise<Trip> {
    const response = await apiClient.patch<{ data: ApiTripResponse }>(
      `${TRIPS_ENDPOINT}/${id}/status`,
      input,
    );

    return mapTrip(response.data);
  }

  /**
   * Finaliza un viaje
   */
  async finish(id: string, input: FinishTripInput): Promise<Trip> {
    const response = await apiClient.post<{ data: ApiTripResponse }>(
      `${TRIPS_ENDPOINT}/${id}/finish`,
      input,
    );

    return mapTrip(response.data);
  }

  /**
   * Elimina un viaje
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${TRIPS_ENDPOINT}/${id}`);
  }

  /**
   * Verifica si existe un viaje con el código dado
   */
  async existsByCode(code: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ exists: boolean }>(
        `${TRIPS_ENDPOINT}/check-code/${code}`,
      );
      return response.exists ?? false;
    } catch {
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  private buildQueryParams(params?: TripQueryParams): Record<string, unknown> {
    if (!params) return {};

    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    };

    if (params.sort?.field) {
      query.sort_by = params.sort.field;
      query.sort_order = params.sort.direction ?? "desc";
    }

    if (params.filters) {
      const {
        status,
        clientId,
        driverId,
        vehicleId,
        dateFrom,
        dateTo,
        search,
      } = params.filters;

      if (status) query.status = Array.isArray(status) ? status : [status];
      if (clientId) query.client_id = clientId;
      if (driverId) query.driver_id = driverId;
      if (vehicleId) query.vehicle_id = vehicleId;
      if (dateFrom) query.date_from = dateFrom;
      if (dateTo) query.date_to = dateTo;
      if (search) query.search = search;
    }

    return query;
  }

  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status === 404;
    }
    return false;
  }
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

export function createTripRepository(): ITripRepository {
  return new TripRepository();
}

export const tripRepository = new TripRepository();
