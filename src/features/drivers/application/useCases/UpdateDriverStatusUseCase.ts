/**
 * UpdateDriverStatusUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para cambiar el estado de un conductor.
 */

import type { UseCaseResult } from "@shared/utils/errorMapper";
import {
  VALID_STATUS_TRANSITIONS,
  type Driver,
  type DriverStatusType,
  type IDriverRepository,
  type UpdateDriverStatusDTO,
} from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class UpdateDriverStatusUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(
    id: string,
    data: UpdateDriverStatusDTO,
  ): Promise<UseCaseResult<Driver>> {
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

      // Validar estado
      if (!data.status) {
        return {
          success: false,
          error: {
            code: "MISSING_STATUS",
            message: "El nuevo estado es requerido",
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

      // Validar transición de estado
      const validationResult = this.validateStatusTransition(
        existingDriver.data.status,
        data.status,
      );
      if (!validationResult.success) {
        return validationResult;
      }

      // Actualizar estado
      const result = await this.driverRepository.updateStatus(id, data);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("[UpdateDriverStatusUseCase] Error:", error);

      return {
        success: false,
        error: {
          code: "UPDATE_STATUS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al actualizar el estado del conductor",
        },
      };
    }
  }

  /**
   * Valida que la transición de estado sea válida
   */
  private validateStatusTransition(
    currentStatus: DriverStatusType,
    newStatus: DriverStatusType,
  ): UseCaseResult<Driver> {
    // Si es el mismo estado, permitir (no-op)
    if (currentStatus === newStatus) {
      return { success: true, data: {} as Driver };
    }

    // Verificar si la transición es válida
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validTransitions?.includes(newStatus)) {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `No se puede cambiar de estado "${currentStatus}" a "${newStatus}"`,
        },
      };
    }

    return { success: true, data: {} as Driver };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory function para crear el caso de uso
 */
export function createUpdateDriverStatusUseCase(
  driverRepository: IDriverRepository,
): UpdateDriverStatusUseCase {
  return new UpdateDriverStatusUseCase(driverRepository);
}
