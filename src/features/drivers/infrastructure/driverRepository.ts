/**
 * Driver Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz IDriverRepository usando HTTP/REST.
 * Esta es la capa que conoce los detalles de implementación (axios, URLs, etc.)
 */

import {
  apiClient,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import {
  type Driver,
  type DriverListItem,
  type DriverQueryParams,
  type DriverTripSummary,
} from "../domain/entities";
import {
  type CreateDriverDTO,
  type UpdateDriverDTO,
  type UpdateDriverStatusDTO,
  type IDriverRepository,
} from "../domain/repository";
import {
  mapDriver,
  mapDriverListItemsResponse,
  mapPaginatedDriverListItems,
  mapPaginatedDriverTrips,
  toApiCreateDriver,
  toApiUpdateDriver,
  toApiUpdateStatus,
  type ApiDriverResponse,
  type ApiDriverListItemResponse,
  type ApiDriverTripResponse,
} from "./mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const DRIVERS_ENDPOINT = "/drivers";

// ============================================================================
// DRIVER REPOSITORY IMPLEMENTATION
// ============================================================================

export class DriverRepository implements IDriverRepository {
  /**
   * Obtiene todos los conductores con filtros y paginación
   */
  async findAll(
    params?: DriverQueryParams,
  ): Promise<MappedPaginatedResult<DriverListItem>> {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiDriverListItemResponse>
    >(DRIVERS_ENDPOINT, {
      params: this.buildQueryParams(params),
    });

    return mapPaginatedDriverListItems(response);
  }

  /**
   * Obtiene un conductor por su ID
   */
  async findById(id: string): Promise<MappedSingleResult<Driver | null>> {
    try {
      const response = await apiClient.get<
        ApiSingleResponse<ApiDriverResponse>
      >(`${DRIVERS_ENDPOINT}/${id}`);
      return mapDriver(response);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return { data: null };
      }
      throw error;
    }
  }

  /**
   * Verifica si existe un conductor con el número de licencia dado
   */
  async existsByLicenseNumber(licenseNumber: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ exists: boolean }>(
        `${DRIVERS_ENDPOINT}/check-license/${licenseNumber}`,
      );
      return response.exists ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene conductores disponibles
   */
  async findAvailable(): Promise<DriverListItem[]> {
    const response = await apiClient.get<{
      data: ApiDriverListItemResponse[];
    }>(`${DRIVERS_ENDPOINT}/available`);

    return mapDriverListItemsResponse(response);
  }

  /**
   * Obtiene los viajes de un conductor
   */
  async findTrips(
    driverId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MappedPaginatedResult<DriverTripSummary>> {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiDriverTripResponse>
    >(`${DRIVERS_ENDPOINT}/${driverId}/trips`, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    });

    return mapPaginatedDriverTrips(response);
  }

  /**
   * Crea un nuevo conductor
   */
  async create(data: CreateDriverDTO): Promise<MappedSingleResult<Driver>> {
    const payload = toApiCreateDriver(data);

    const response = await apiClient.post<ApiSingleResponse<ApiDriverResponse>>(
      DRIVERS_ENDPOINT,
      payload,
    );

    return mapDriver(response);
  }

  /**
   * Actualiza un conductor existente
   */
  async update(
    id: string,
    data: UpdateDriverDTO,
  ): Promise<MappedSingleResult<Driver>> {
    const apiData = toApiUpdateDriver(data);

    const response = await apiClient.put<ApiSingleResponse<ApiDriverResponse>>(
      `${DRIVERS_ENDPOINT}/${id}`,
      apiData,
    );

    return mapDriver(response);
  }

  /**
   * Actualiza el estado de un conductor
   */
  async updateStatus(
    id: string,
    data: UpdateDriverStatusDTO,
  ): Promise<MappedSingleResult<Driver>> {
    const apiData = toApiUpdateStatus(data);

    const response = await apiClient.patch<
      ApiSingleResponse<ApiDriverResponse>
    >(`${DRIVERS_ENDPOINT}/${id}/status`, apiData);

    return mapDriver(response);
  }

  /**
   * Elimina un conductor
   */
  async delete(id: string): Promise<MappedActionResult> {
    const response = await apiClient.delete<{ message: string }>(
      `${DRIVERS_ENDPOINT}/${id}`,
    );
    return {
      message: response.message,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Construye los parámetros de consulta para la API
   */
  private buildQueryParams(
    params?: DriverQueryParams,
  ): Record<string, unknown> {
    if (!params) return {};

    const queryParams: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    };

    // Ordenamiento
    if (params.sort?.field) {
      queryParams.sort_by = params.sort.field;
      queryParams.sort_order = params.sort.direction ?? "desc";
    }

    // Filtros
    if (params.filters) {
      const {
        status,
        licenseType,
        search,
        licenseExpiringSoon,
        minExperience,
        maxExperience,
        branchId,
      } = params.filters;

      if (status) {
        queryParams.status = Array.isArray(status) ? status : [status];
      }
      if (licenseType) queryParams.license_type = licenseType;
      if (search) queryParams.search = search;
      if (licenseExpiringSoon !== undefined)
        queryParams.license_expiring_soon = licenseExpiringSoon;
      if (minExperience !== undefined)
        queryParams.min_experience = minExperience;
      if (maxExperience !== undefined)
        queryParams.max_experience = maxExperience;
      if (branchId) queryParams.branch_id = branchId;
    }

    return queryParams;
  }

  /**
   * Verifica si un error es un 404
   */
  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status === 404;
    }
    return false;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Crea una instancia del repositorio de conductores
 */
export function createDriverRepository(): IDriverRepository {
  return new DriverRepository();
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia singleton del repositorio
 */
export const driverRepository = new DriverRepository();
