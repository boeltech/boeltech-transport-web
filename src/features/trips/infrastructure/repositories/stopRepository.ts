/**
 * Stop Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * ACTUALIZADO: Alineado con la estructura real del Backend
 *
 * Implementa la interfaz IStopRepository usando HTTP/REST.
 * Esta es la capa que conoce los detalles de implementación (axios, URLs, etc.)
 */

import { apiClient } from "@/shared/api";
import {
  type TripStop,
  type CreateTripStopDTO,
  type AddStopData,
  type IStopRepository,
} from "@features/trips/domain";
import {
  mapTripStop,
  toApiCreateStop,
  type ApiTripStopResponse,
} from "./mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIPS_ENDPOINT = "/trips";

// ============================================================================
// STOP REPOSITORY IMPLEMENTATION
// ============================================================================

export class StopRepository implements IStopRepository {
  /**
   * Obtiene todas las paradas de un viaje
   */
  async findByTripId(tripId: string): Promise<TripStop[]> {
    const response = await apiClient.get<ApiTripStopResponse[]>(
      `${TRIPS_ENDPOINT}/${tripId}/stops`,
    );

    const data = this.extractData(response);
    return Array.isArray(data) ? data.map(mapTripStop) : [];
  }

  /**
   * Obtiene una parada por su ID
   */
  async findById(tripId: string, stopId: string): Promise<TripStop | null> {
    try {
      const response = await apiClient.get<ApiTripStopResponse>(
        `${TRIPS_ENDPOINT}/${tripId}/stops/${stopId}`,
      );

      const data = this.extractData(response);
      return mapTripStop(data);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Agrega una nueva parada a un viaje
   */
  async add(tripId: string, data: AddStopData): Promise<TripStop> {
    const apiData = toApiCreateStop({
      sequenceOrder: data.sequenceOrder,
      stopType: data.stopType,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      estimatedArrival: data.estimatedArrival,
      cargoActionDescription: data.cargoActionDescription,
      cargoWeight: data.cargoWeight,
      cargoUnits: data.cargoUnits,
      notes: data.notes,
    });

    const response = await apiClient.post<ApiTripStopResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/stops`,
      apiData,
    );

    const responseData = this.extractData(response);
    return mapTripStop(responseData);
  }

  /**
   * Actualiza una parada existente
   */
  async update(
    tripId: string,
    stopId: string,
    data: Partial<CreateTripStopDTO>,
  ): Promise<TripStop> {
    // Solo enviar campos que tienen valor
    const updateData: Record<string, unknown> = {};

    if (data.sequenceOrder !== undefined)
      updateData.sequenceOrder = data.sequenceOrder;
    if (data.stopType !== undefined) updateData.stopType = data.stopType;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.locationName !== undefined)
      updateData.locationName = data.locationName;
    if (data.contactName !== undefined)
      updateData.contactName = data.contactName;
    if (data.contactPhone !== undefined)
      updateData.contactPhone = data.contactPhone;
    if (data.estimatedArrival !== undefined)
      updateData.estimatedArrival = data.estimatedArrival;
    if (data.cargoActionDescription !== undefined)
      updateData.cargoActionDescription = data.cargoActionDescription;
    if (data.cargoWeight !== undefined)
      updateData.cargoWeight = data.cargoWeight;
    if (data.cargoUnits !== undefined) updateData.cargoUnits = data.cargoUnits;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const response = await apiClient.put<ApiTripStopResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/stops/${stopId}`,
      updateData,
    );

    const responseData = this.extractData(response);
    return mapTripStop(responseData);
  }

  /**
   * Elimina una parada
   */
  async delete(tripId: string, stopId: string): Promise<void> {
    await apiClient.delete(`${TRIPS_ENDPOINT}/${tripId}/stops/${stopId}`);
  }

  /**
   * Reordena las paradas de un viaje
   */
  async reorder(tripId: string, orderedIds: string[]): Promise<TripStop[]> {
    const response = await apiClient.patch<ApiTripStopResponse[]>(
      `${TRIPS_ENDPOINT}/${tripId}/stops/reorder`,
      { orderedIds },
    );

    const data = this.extractData(response);
    return Array.isArray(data) ? data.map(mapTripStop) : [];
  }

  /**
   * Marca una parada como visitada
   */
  async markVisited(
    tripId: string,
    stopId: string,
    actualArrival: Date,
  ): Promise<TripStop> {
    const response = await apiClient.patch<ApiTripStopResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/stops/${stopId}/visited`,
      {
        actualArrival: actualArrival.toISOString(),
      },
    );

    const responseData = this.extractData(response);
    return mapTripStop(responseData);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

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
 * Crea una instancia del repositorio de paradas
 */
export function createStopRepository(): IStopRepository {
  return new StopRepository();
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia singleton del repositorio
 */
export const stopRepository = new StopRepository();
