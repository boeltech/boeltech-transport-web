/**
 * GetDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para obtener un conductor por su ID.
 */

import type { UseCaseResult } from "@shared/utils/errorMapper";
import type { Driver, IDriverRepository } from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class GetDriverUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(id: string): Promise<UseCaseResult<Driver | null>> {
    try {
      // Validar ID
      if (!id || id.trim() === "") {
        return {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "El ID del conductor es requerido",
          },
        };
      }

      const result = await this.driverRepository.findById(id);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("[GetDriverUseCase] Error:", error);

      return {
        success: false,
        error: {
          code: "FETCH_DRIVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al obtener el conductor",
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
export function createGetDriverUseCase(
  driverRepository: IDriverRepository,
): GetDriverUseCase {
  return new GetDriverUseCase(driverRepository);
}
