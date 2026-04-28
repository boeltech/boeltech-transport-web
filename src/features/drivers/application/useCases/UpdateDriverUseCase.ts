/**
 * UpdateDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para actualizar un conductor existente.
 */

import type { UseCaseResult } from "@shared/utils/errorMapper";
import type { Driver, IDriverRepository, UpdateDriverDTO } from "../../domain";
import { isExpired } from "@shared/utils/dateUtils";

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

      // Validaciones de negocio
      const validationResult = await this.validate(
        id,
        data,
        existingDriver.data,
      );
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
   * Valida los datos antes de actualizar
   */
  private async validate(
    _id: string,
    data: UpdateDriverDTO,
    existingDriver: Driver,
  ): Promise<UseCaseResult<Driver>> {
    // Si se está actualizando la fecha de vencimiento, validar que no esté vencida
    if (isExpired(data.licenseExpiry)) {
      return {
        success: false,
        error: {
          code: "LICENSE_EXPIRED",
          message:
            "No se puede establecer una fecha de vencimiento en el pasado",
        },
      };
    }

    // Si se está cambiando el número de licencia, verificar que no esté en uso
    if (
      data.licenseNumber &&
      data.licenseNumber !== existingDriver.licenseNumber
    ) {
      const licenseExists = await this.driverRepository.existsByLicenseNumber(
        data.licenseNumber,
      );
      if (licenseExists) {
        return {
          success: false,
          error: {
            code: "LICENSE_NUMBER_EXISTS",
            message: "Ya existe un conductor con este número de licencia",
          },
        };
      }
    }

    // Validación exitosa
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
