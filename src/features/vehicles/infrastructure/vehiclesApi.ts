/**
 * Vehicles API Client
 * Clean Architecture - Infrastructure Layer
 *
 * Comunicación HTTP con el backend. Usa los mappers para convertir
 * las respuestas snake_case de la API a entidades del dominio (camelCase).
 *
 * Ubicación: src/features/vehicles/infrastructure/vehiclesApi.ts
 *
 * REGLA: Esta capa conoce URLs, headers y formato de la API.
 *        Retorna SIEMPRE entidades del dominio, nunca raw data.
 */

import {
  apiClient,
  mapActionResponse,
  type ApiActionResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import {
  mapVehicleList,
  mapVehicleDetail,
  type ApiVehicleListItemResponse,
  type ApiVehicleResponse,
} from "./mappers";
import type {
  Vehicle,
  VehicleListItem,
  VehicleQueryParams,
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleStatusType,
} from "@features/vehicles/domain";

// ============================================================================
// CONSTANTS
// ============================================================================

const VEHICLE_ENDPOINT = "/vehicles";

// ============================================================================
// TIPOS DE RESPUESTA RAW (snake_case del backend)
// ============================================================================

/** Respuesta de POST /vehicles */
interface CreateVehicleRawResponse {
  message: string;
  data: {
    id: string;
    unit_number: string;
  };
}

// ============================================================================
// API CLIENT
// ============================================================================

export const vehiclesApi = {
  /**
   * GET /api/v1/vehicles
   * Response: { data: [...], pagination: {...} }
   */
  getAll: async (
    params?: VehicleQueryParams,
  ): Promise<MappedPaginatedResult<VehicleListItem>> => {
    const searchParams = new URLSearchParams();

    // Filters
    if (params?.filters?.status) {
      const statuses = Array.isArray(params.filters.status)
        ? params.filters.status
        : [params.filters.status];
      statuses.forEach((s) => searchParams.append("status", s));
    }
    if (params?.filters?.type) {
      searchParams.append("type", params.filters.type);
    }
    if (params?.filters?.isActive !== undefined) {
      searchParams.append("is_active", String(params.filters.isActive));
    }
    if (params?.filters?.search) {
      searchParams.append("search", params.filters.search);
    }

    // Sort
    if (params?.sort?.field) {
      searchParams.append("sort_by", params.sort.field);
    }
    if (params?.sort?.direction) {
      searchParams.append("sort_order", params.sort.direction);
    }

    // Pagination
    if (params?.page) {
      searchParams.append("page", String(params.page));
    }
    if (params?.limit) {
      searchParams.append("limit", String(params.limit));
    }

    const query = searchParams.toString();
    const url = `${VEHICLE_ENDPOINT}${query ? `?${query}` : ""}`;

    const response = await apiClient.get(url);
    return mapVehicleList(
      response as unknown as ApiPaginatedResponse<ApiVehicleListItemResponse>,
    );
  },

  /**
   * GET /api/v1/vehicles/:id
   * Response: { data: { ...vehicle } }
   */
  getById: async (id: string): Promise<MappedSingleResult<Vehicle>> => {
    const response = await apiClient.get(`${VEHICLE_ENDPOINT}/${id}`);
    return mapVehicleDetail(response as unknown as ApiSingleResponse<ApiVehicleResponse>);
  },

  /**
   * POST /api/v1/vehicles
   * Response: { message, data: { id, unit_number } }
   */
  create: async (
    payload: CreateVehiclePayload,
  ): Promise<MappedSingleResult<{ id: string; unitNumber: string }>> => {
    const response = await apiClient.post<CreateVehicleRawResponse>(
      VEHICLE_ENDPOINT,
      payload,
    );

    return {
      data: {
        id: response.data.id,
        unitNumber: response.data.unit_number,
      },
      message: response.message,
    };
  },

  /**
   * PUT /api/v1/vehicles/:id
   * Response: { message, data: { ...vehicle } }
   */
  update: async (
    id: string,
    payload: UpdateVehiclePayload,
  ): Promise<MappedSingleResult<Vehicle>> => {
    const response = await apiClient.put(`${VEHICLE_ENDPOINT}/${id}`, payload);
    return mapVehicleDetail(response as unknown as ApiSingleResponse<ApiVehicleResponse>);
  },

  /**
   * PATCH /api/v1/vehicles/:id/status
   * Response: { message, data: { ...vehicle } }
   */
  updateStatus: async (
    id: string,
    status: VehicleStatusType,
  ): Promise<MappedSingleResult<Vehicle>> => {
    const response = await apiClient.patch(`${VEHICLE_ENDPOINT}/${id}/status`, {
      status,
    });
    return mapVehicleDetail(response as unknown as ApiSingleResponse<ApiVehicleResponse>);
  },

  /**
   * DELETE /api/v1/vehicles/:id
   * Response: { message }
   */
  delete: async (id: string): Promise<MappedActionResult> => {
    const response = await apiClient.delete(`${VEHICLE_ENDPOINT}/${id}`);
    return mapActionResponse(response as unknown as ApiActionResponse);
  },
};
