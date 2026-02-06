/**
 * Trip Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * ACTUALIZADO: Alineado con la estructura real del Backend
 *
 * Implementa la interfaz ITripRepository usando HTTP/REST.
 * Esta es la capa que conoce los detalles de implementación (axios, URLs, etc.)
 */

import { apiClient } from "@/shared/api";
import {
  type Trip,
  type TripListItem,
  type TripQueryParams,
  type PaginatedList,
  type CreateTripDTO,
  type UpdateTripDTO,
  type UpdateTripStatusDTO,
  type FinishTripDTO,
  type ITripRepository,
} from "@features/trips/domain";
import {
  mapTrip,
  mapPaginatedTripListItems,
  toApiCreateTrip,
  toApiUpdateStatus,
  toApiFinishTrip,
  type ApiTripResponse,
  type ApiTripListItemResponse,
  type ApiPaginatedResponse,
} from "./mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIPS_ENDPOINT = "/trips";

// ============================================================================
// TRIP REPOSITORY IMPLEMENTATION
// ============================================================================

export class TripRepository implements ITripRepository {
  /**
   * Obtiene todos los viajes con filtros y paginación
   */
  async findAll(
    params?: TripQueryParams,
  ): Promise<PaginatedList<TripListItem>> {
    const response = await apiClient.get<
      ApiPaginatedResponse<ApiTripListItemResponse>
    >(TRIPS_ENDPOINT, {
      params: this.buildQueryParams(params),
    });

    // apiClient.get retorna response.data directamente si está configurado así,
    // o response completo si no. Ajustar según tu configuración de axios.
    // const data = this.extractData(response);
    return mapPaginatedTripListItems(response);
  }

  /**
   * Obtiene un viaje por su ID
   */
  async findById(id: string): Promise<Trip | null> {
    try {
      const response = await apiClient.get<ApiTripResponse>(
        `${TRIPS_ENDPOINT}/${id}`,
      );
      const data = this.extractData(response);
      return mapTrip(data);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Crea un nuevo viaje
   */
  async create(data: CreateTripDTO): Promise<Trip> {
    // Usar toApiCreateTrip que ya incluye el mapeo de stops, cargos y expenses
    const apiData = toApiCreateTrip(data);

    const response = await apiClient.post<ApiTripResponse>(
      TRIPS_ENDPOINT,
      apiData,
    );

    const responseData = this.extractData(response);
    return mapTrip(responseData);
  }

  /**
   * Actualiza un viaje existente
   */
  async update(id: string, data: UpdateTripDTO): Promise<Trip> {
    // Solo enviar campos que tienen valor
    const updateData: Record<string, unknown> = {};

    if (data.vehicleId !== undefined) updateData.vehicleId = data.vehicleId;
    if (data.driverId !== undefined) updateData.driverId = data.driverId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.scheduledDeparture !== undefined)
      updateData.scheduledDeparture = data.scheduledDeparture;
    if (data.scheduledArrival !== undefined)
      updateData.scheduledArrival = data.scheduledArrival;
    if (data.startMileage !== undefined)
      updateData.startMileage = data.startMileage;
    if (data.originAddress !== undefined)
      updateData.originAddress = data.originAddress;
    if (data.originCity !== undefined) updateData.originCity = data.originCity;
    if (data.originState !== undefined)
      updateData.originState = data.originState;
    if (data.destinationAddress !== undefined)
      updateData.destinationAddress = data.destinationAddress;
    if (data.destinationCity !== undefined)
      updateData.destinationCity = data.destinationCity;
    if (data.destinationState !== undefined)
      updateData.destinationState = data.destinationState;
    if (data.cargoDescription !== undefined)
      updateData.cargoDescription = data.cargoDescription;
    if (data.cargoWeight !== undefined)
      updateData.cargoWeight = data.cargoWeight;
    if (data.cargoVolume !== undefined)
      updateData.cargoVolume = data.cargoVolume;
    if (data.cargoUnits !== undefined) updateData.cargoUnits = data.cargoUnits;
    if (data.cargoValue !== undefined) updateData.cargoValue = data.cargoValue;
    if (data.baseRate !== undefined) updateData.baseRate = data.baseRate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const response = await apiClient.put<ApiTripResponse>(
      `${TRIPS_ENDPOINT}/${id}`,
      updateData,
    );

    const responseData = this.extractData(response);
    return mapTrip(responseData);
  }

  /**
   * Actualiza el estado de un viaje
   */
  async updateStatus(id: string, data: UpdateTripStatusDTO): Promise<Trip> {
    const apiData = toApiUpdateStatus(data);

    const response = await apiClient.patch<ApiTripResponse>(
      `${TRIPS_ENDPOINT}/${id}/status`,
      apiData,
    );

    const responseData = this.extractData(response);
    return mapTrip(responseData);
  }

  /**
   * Finaliza un viaje
   */
  async finish(id: string, data: FinishTripDTO): Promise<Trip> {
    const apiData = toApiFinishTrip(data);

    const response = await apiClient.patch<ApiTripResponse>(
      `${TRIPS_ENDPOINT}/${id}/finish`,
      apiData,
    );

    const responseData = this.extractData(response);
    return mapTrip(responseData);
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
      const data = this.extractData(response);
      return data?.exists ?? false;
    } catch {
      // Si falla, asumimos que no existe
      return false;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Construye los parámetros de consulta para la API
   */
  private buildQueryParams(params?: TripQueryParams): Record<string, unknown> {
    if (!params) return {};

    const queryParams: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    };

    // Ordenamiento
    if (params.sort?.field) {
      queryParams.sortBy = params.sort.field;
      queryParams.sortOrder = params.sort.direction ?? "desc";
    }

    // Filtros
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

      if (status) {
        queryParams.status = Array.isArray(status) ? status : [status];
      }
      if (clientId) queryParams.clientId = clientId;
      if (driverId) queryParams.driverId = driverId;
      if (vehicleId) queryParams.vehicleId = vehicleId;
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (dateTo) queryParams.dateTo = dateTo;
      if (search) queryParams.search = search;
    }

    return queryParams;
  }

  /**
   * Extrae los datos de la respuesta de axios
   * Maneja tanto el caso donde apiClient retorna response.data
   * como cuando retorna el response completo
   */
  private extractData<T>(response: T | { data: T }): T {
    if (response && typeof response === "object" && "data" in response) {
      return (response as { data: T }).data;
    }
    return response as T;
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
 * Crea una instancia del repositorio de viajes
 */
export function createTripRepository(): ITripRepository {
  return new TripRepository();
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia singleton del repositorio
 */
export const tripRepository = new TripRepository();
