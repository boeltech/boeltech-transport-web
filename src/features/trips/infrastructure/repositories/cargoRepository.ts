/**
 * Cargo Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz ICargoRepository.
 * Enfoque B: Operaciones separadas del viaje principal.
 */

import {
  apiClient,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedSingleResult,
} from "@shared/api";
import type {
  CargoMovement,
  CompleteCargoMovementInput,
  CreateCargoInput,
  CreateCargoMovementInput,
  ICargoRepository,
  TripCargo,
  UpdateCargoInput,
} from "@features/trips/domain";
import type {
  ApiCargoMovementResponse,
  ApiCargoResponse,
} from "../api/api-types";
import {
  mapCargoMovementResponse,
  mapCargoResponse,
  mapCargosResponse,
} from "../api/mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIPS_ENDPOINT = "/trips";

// ============================================================================
// CARGO REPOSITORY
// ============================================================================

export class CargoRepository implements ICargoRepository {
  /**
   * Obtiene todas las cargas de un viaje
   */
  async findByTripId(tripId: string): Promise<MappedSingleResult<TripCargo[]>> {
    const response = await apiClient.get<ApiSingleResponse<ApiCargoResponse[]>>(
      `${TRIPS_ENDPOINT}/${tripId}/cargos`,
    );

    return mapCargosResponse(response);
  }

  /**
   * Obtiene una carga por ID
   */
  async findById(
    tripId: string,
    cargoId: string,
  ): Promise<MappedSingleResult<TripCargo | null>> {
    try {
      const response = await apiClient.get<ApiSingleResponse<ApiCargoResponse>>(
        `${TRIPS_ENDPOINT}/${tripId}/cargos/${cargoId}`,
      );

      return mapCargoResponse(response);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return { data: null, message: "Carga no encontrada" };
      }
      throw error;
    }
  }

  /**
   * Agrega una carga a un viaje
   */
  async create(
    tripId: string,
    input: CreateCargoInput,
  ): Promise<MappedSingleResult<TripCargo>> {
    // const apiData = toApiCreateCargo(data);

    const response = await apiClient.post<ApiSingleResponse<ApiCargoResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/cargos`,
      input,
    );

    return mapCargoResponse(response);
  }

  /**
   * Actualiza una carga
   */
  async update(
    tripId: string,
    cargoId: string,
    input: UpdateCargoInput,
  ): Promise<MappedSingleResult<TripCargo>> {
    // const apiData = toApiUpdateCargo(data);

    const response = await apiClient.put<ApiSingleResponse<ApiCargoResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/cargos/${cargoId}`,
      input,
    );

    return mapCargoResponse(response);
  }

  /**
   * Elimina una carga
   */
  async delete(tripId: string, cargoId: string): Promise<MappedActionResult> {
    await apiClient.delete(
      `${TRIPS_ENDPOINT}/${tripId}/cargos/${cargoId}`,
    );

    return { message: "Carga eliminada exitosamente" };
  }

  /**
   * Agrega un movimiento a una carga
   */
  async addMovement(
    tripId: string,
    cargoId: string,
    input: CreateCargoMovementInput,
  ): Promise<MappedSingleResult<CargoMovement>> {
    // const apiData = toApiCreateCargoMovement(data);

    const response = await apiClient.post<
      ApiSingleResponse<ApiCargoMovementResponse>
    >(`${TRIPS_ENDPOINT}/${tripId}/cargos/${cargoId}/movements`, input);

    return mapCargoMovementResponse(response);
  }

  /**
   * Marca un movimiento como completado
   */
  async completeMovement(
    tripId: string,
    cargoId: string,
    movementId: string,
    data?: CompleteCargoMovementInput,
  ): Promise<MappedSingleResult<CargoMovement>> {
    const apiData = data
      ? { completed_at: data.completedAt, notes: data.notes }
      : {};

    const response = await apiClient.patch<
      ApiSingleResponse<ApiCargoMovementResponse>
    >(
      `${TRIPS_ENDPOINT}/${tripId}/cargos/${cargoId}/movements/${movementId}/complete`,
      apiData,
    );

    return mapCargoMovementResponse(response);
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
// FACTORY FUNCTIONS
// ============================================================================

export function createCargoRepository(): ICargoRepository {
  return new CargoRepository();
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const cargoRepository = new CargoRepository();
