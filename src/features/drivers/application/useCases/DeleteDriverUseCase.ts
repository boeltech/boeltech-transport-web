/**
 * DeleteDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para eliminar un conductor.
 */

import type { MappedActionResult } from "@shared/api";
import { DriverStatus, type IDriverRepository } from "../../domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// USE CASE
// ============================================================================

export class DeleteDriverUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(id: string): Promise<UseCaseResult<MappedActionResult>> {
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

      // Verificar que el conductor existe
      const existingDriver = await this.driverRepository.findById(id);
      if (!existingDriver.data) {
        return {
          success: false,
          error: {
            code: "DRIVER_NOT_FOUND",
            message: "El conductor no existe",
          },
        };
      }

      // Validar que el conductor no esté en un viaje activo
      if (existingDriver.data.status === DriverStatus.ON_TRIP) {
        return {
          success: false,
          error: {
            code: "DRIVER_ON_TRIP",
            message:
              "No se puede eliminar un conductor que está actualmente en un viaje",
          },
        };
      }

      // Eliminar conductor
      const result = await this.driverRepository.delete(id);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("[DeleteDriverUseCase] Error:", error);

      return {
        success: false,
        error: {
          code: "DELETE_DRIVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al eliminar el conductor",
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
export function createDeleteDriverUseCase(
  driverRepository: IDriverRepository,
): DeleteDriverUseCase {
  return new DeleteDriverUseCase(driverRepository);
}
