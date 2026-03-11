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
import { type TripStop, type IStopRepository } from "@features/trips/domain";
import { mapTripStop, type ApiStopResponse } from "../mappers/stopMappers";
import type { CreateStopInput } from "@features/trips/application";

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
    const response = await apiClient.get<ApiStopResponse[]>(
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
      const response = await apiClient.get<ApiStopResponse>(
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
  async add(tripId: string, input: CreateStopInput): Promise<TripStop> {
    // const apiData = toApiCreateStop({
    //   sequenceOrder: data.sequenceOrder,
    //   stopType: data.stopType,
    //   address: data.address,
    //   city: data.city,
    //   state: data.state,
    //   postalCode: data.postalCode,
    //   latitude: data.latitude,
    //   longitude: data.longitude,
    //   locationName: data.locationName,
    //   contactName: data.contactName,
    //   contactPhone: data.contactPhone,
    //   estimatedArrival: data.estimatedArrival,
    //   cargoActionDescription: data.cargoActionDescription,
    //   cargoWeight: data.cargoWeight,
    //   cargoUnits: data.cargoUnits,
    //   notes: data.notes,
    // });

    const response = await apiClient.post<ApiStopResponse>(
      `${TRIPS_ENDPOINT}/${tripId}/stops`,
      input,
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
    input: Partial<CreateStopInput>,
  ): Promise<TripStop> {
    // Solo enviar campos que tienen valor
    const updateData: Record<string, unknown> = {};

    if (input.sequenceOrder !== undefined)
      updateData.sequenceOrder = input.sequenceOrder;
    if (input.stopType !== undefined) updateData.stopType = input.stopType;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.postalCode !== undefined)
      updateData.postalCode = input.postalCode;
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.locationName !== undefined)
      updateData.locationName = input.locationName;
    if (input.contactName !== undefined)
      updateData.contactName = input.contactName;
    if (input.contactPhone !== undefined)
      updateData.contactPhone = input.contactPhone;
    if (input.estimatedArrival !== undefined)
      updateData.estimatedArrival = input.estimatedArrival;
    // if (input.cargoActionDescription !== undefined)
    //   updateData.cargoActionDescription = input.cargoActionDescription;
    // if (input.cargoWeight !== undefined)
    //   updateData.cargoWeight = input.cargoWeight;
    // if (input.cargoUnits !== undefined)
    //   updateData.cargoUnits = input.cargoUnits;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const response = await apiClient.put<ApiStopResponse>(
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
    const response = await apiClient.patch<ApiStopResponse[]>(
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
    const response = await apiClient.patch<ApiStopResponse>(
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
