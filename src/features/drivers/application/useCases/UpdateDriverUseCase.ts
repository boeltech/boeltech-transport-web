/**
 * UpdateDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para actualizar un conductor existente.
 * Unicidad de licencia: fuente de verdad en API (PUT/PATCH /drivers/:id); sin pre-check HTTP.
 */

import { isApiError } from "@shared/api/interceptors/error-handler";
import type { UseCaseResult } from "@shared/utils/errorMapper";
import type { Driver, IDriverRepository, UpdateDriverDTO } from "../../domain";
import { isStrictlyPast } from "@shared/utils/dateUtils";

// ============================================================================
// USE CASE
// ============================================================================

export class UpdateDriverUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(
    id: string,
    data: UpdateDriverDTO,
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

      // Validaciones de negocio (sync; unicidad la resuelve la API)
      const validationResult = this.validate(data);
      if (!validationResult.success) {
        return validationResult;
      }

      // Actualizar conductor
      const result = await this.driverRepository.update(id, data);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }

      console.error("[UpdateDriverUseCase] Error:", error);

      return {
        success: false,
        error: {
          code: "UPDATE_DRIVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al actualizar el conductor",
        },
      };
    }
  }

  /**
   * Validación sync local (sin round-trips). Unicidad de licencia la resuelve la API.
   */
  private validate(data: UpdateDriverDTO): UseCaseResult<Driver> {
    if (data.federalLicenseExpiry && isStrictlyPast(data.federalLicenseExpiry)) {
      return {
        success: false,
        error: {
          code: "LICENSE_EXPIRED",
          message:
            "No se puede establecer una fecha de vencimiento federal en el pasado",
        },
      };
    }

    if (data.stateLicenseExpiry && isStrictlyPast(data.stateLicenseExpiry)) {
      return {
        success: false,
        error: {
          code: "LICENSE_EXPIRED",
          message:
            "No se puede establecer una fecha de vencimiento estatal en el pasado",
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
export function createUpdateDriverUseCase(
  driverRepository: IDriverRepository,
): UpdateDriverUseCase {
  return new UpdateDriverUseCase(driverRepository);
}
