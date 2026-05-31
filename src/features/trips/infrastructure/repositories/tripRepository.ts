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

import {
  apiClient,
  type ApiPaginatedResponse,
  type MappedSingleResult,
} from "@shared/api";
import type {
  CreateTripInput,
  ITripRepository,
  PaginatedResult,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "@features/trips/domain";
import type {
  Trip,
  TripListItem,
  TripQueryParams,
} from "@features/trips/domain";
import type { CreateTripResult } from "@features/trips/application/useCases/trip/CreateTripUseCase";
import type {
  ApiCreateTripResponse,
  ApiTripListItemResponse,
  ApiTripResponse,
} from "../api/api-types";
import {
  mapApiTripListItem,
  mapCreateTripResponse,
  mapTripResponse,
} from "../api/mappers";
import {
  summarizeTripApiPayloadErrors,
  validateTripQueryApiPayload,
  validateUpdateTripStatusApiPayload,
} from "@features/trips/presentation/pages/create/validateTripApiPayload";

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
    const queryParams = this.buildQueryParams(params);
    const queryValidation = validateTripQueryApiPayload(queryParams);
    if (!queryValidation.ok) {
      throw new Error(
        summarizeTripApiPayloadErrors(queryValidation.fieldErrors, 2),
      );
    }

    const response = await apiClient.get<
      ApiPaginatedResponse<ApiTripListItemResponse>
    >(TRIPS_ENDPOINT, { params: queryParams });

    return {
      data: response.data.map(mapApiTripListItem),
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
  async findById(id: string): Promise<MappedSingleResult<Trip> | null> {
    try {
      const response = await apiClient.get<{ data: ApiTripResponse }>(
        `${TRIPS_ENDPOINT}/${id}`,
      );
      return mapTripResponse(response);
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
  async update(
    id: string,
    input: UpdateTripInput,
  ): Promise<MappedSingleResult<Trip>> {
    const response = await apiClient.put<{ data: ApiTripResponse }>(
      `${TRIPS_ENDPOINT}/${id}`,
      input, // ← camelCase, se convierte automáticamente
    );

    return mapTripResponse(response);
  }

  /**
   * Actualiza el estado de un viaje
   */
  async updateStatus(
    id: string,
    input: UpdateTripStatusInput,
  ): Promise<MappedSingleResult<Trip>> {
    const statusValidation = validateUpdateTripStatusApiPayload(input);
    if (!statusValidation.ok) {
      throw new Error(
        summarizeTripApiPayloadErrors(statusValidation.fieldErrors, 2),
      );
    }

    const response = await apiClient.patch<{ data: ApiTripResponse }>(
      `${TRIPS_ENDPOINT}/${id}/status`,
      input,
    );

    return mapTripResponse(response);
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
      if (params.filters.requiresFiscalAttention === true) {
        query.requires_fiscal_attention = true;
      }
      if (params.filters.invoiceStatus) {
        query.invoice_status = params.filters.invoiceStatus;
      }
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
