/**
 * Driver Query Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para queries específicas de conductores:
 * - GetAvailableDrivers: Obtener conductores disponibles para asignación
 * - GetDriverTrips: Obtener historial de viajes de un conductor
 */

import type { IDriverRepository } from "@features/drivers/domain/repository";
import type { DriverTripSummary } from "@features/drivers/domain";
import type { MappedPaginatedResult } from "@shared/api";
import { mapBackendError, type UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// GET DRIVER TRIPS USE CASE
// ============================================================================

export interface GetDriverTripsParams {
  page?: number;
  limit?: number;
}

export interface IGetDriverTripsUseCase {
  execute(
    driverId: string,
    params?: GetDriverTripsParams,
  ): Promise<UseCaseResult<MappedPaginatedResult<DriverTripSummary>>>;
}

/**
 * Obtiene el historial de viajes de un conductor con paginación.
 *
 * Útil para:
 * - Ver el historial de actividad del conductor
 * - Calcular estadísticas de rendimiento
 * - Generar reportes
 */
export class GetDriverTripsUseCase implements IGetDriverTripsUseCase {
  private readonly repository: IDriverRepository;

  constructor(repository: IDriverRepository) {
    this.repository = repository;
  }

  async execute(
    driverId: string,
    params?: GetDriverTripsParams,
  ): Promise<UseCaseResult<MappedPaginatedResult<DriverTripSummary>>> {
    try {
      // Validación básica
      if (!driverId) {
        return {
          success: false,
          error: {
            code: "DRIVER_ID_REQUIRED",
            message: "El ID del conductor es requerido",
          },
        };
      }

      const result = await this.repository.findTrips(driverId, {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("[GetDriverTripsUseCase] Error:", error);

      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createGetDriverTripsUseCase(
  repository: IDriverRepository,
): IGetDriverTripsUseCase {
  return new GetDriverTripsUseCase(repository);
}
