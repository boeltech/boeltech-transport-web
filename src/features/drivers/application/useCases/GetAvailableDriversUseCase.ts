/**
 * Driver Query Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para queries específicas de conductores:
 * - GetAvailableDrivers: Obtener conductores disponibles para asignación
 * - GetDriverTrips: Obtener historial de viajes de un conductor
 */

import type { DriverListItem } from "@features/drivers/domain/entities";
import type { IDriverRepository } from "@features/drivers/domain/repository";
import { mapBackendError, type UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// GET AVAILABLE DRIVERS USE CASE
// ============================================================================

export interface IGetAvailableDriversUseCase {
  execute(): Promise<UseCaseResult<DriverListItem[]>>;
}

/**
 * Obtiene los conductores disponibles para asignación a viajes.
 *
 * Un conductor está disponible si:
 * - isActive = true
 * - status = "available"
 * - licenseExpiry > now
 */
export class GetAvailableDriversUseCase implements IGetAvailableDriversUseCase {
  private readonly repository: IDriverRepository;

  constructor(repository: IDriverRepository) {
    this.repository = repository;
  }

  async execute(): Promise<UseCaseResult<DriverListItem[]>> {
    try {
      const drivers = await this.repository.findAvailable();

      return {
        success: true,
        data: drivers,
      };
    } catch (error) {
      console.error("[GetAvailableDriversUseCase] Error:", error);

      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createGetAvailableDriversUseCase(
  repository: IDriverRepository,
): IGetAvailableDriversUseCase {
  return new GetAvailableDriversUseCase(repository);
}
