/**
 * GetDriversUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para obtener la lista de conductores con filtros y paginación.
 */

import type { MappedPaginatedResult } from "@shared/api";
import type {
  DriverListItem,
  DriverQueryParams,
  IDriverRepository,
} from "../../domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// USE CASE
// ============================================================================

export class GetDriversUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(
    params?: DriverQueryParams,
  ): Promise<UseCaseResult<MappedPaginatedResult<DriverListItem>>> {
    try {
      const result = await this.driverRepository.findAll(params);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("[GetDriversUseCase] Error:", error);

      return {
        success: false,
        error: {
          code: "FETCH_DRIVERS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al obtener los conductores",
        },
      };
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory function para crear el caso de uso
 */
export function createGetDriversUseCase(
  driverRepository: IDriverRepository,
): GetDriversUseCase {
  return new GetDriversUseCase(driverRepository);
}
