/**
 * CreateDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para crear un nuevo conductor.
 * Unicidad de licencia: fuente de verdad en API (POST /drivers); sin pre-check HTTP.
 */

import { isApiError } from "@shared/api/interceptors/error-handler";
import type { UseCaseResult } from "@shared/utils/errorMapper";
import type { Driver, IDriverRepository, CreateDriverDTO } from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class CreateDriverUseCase {
  private readonly driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository) {
    this.driverRepository = driverRepository;
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(data: CreateDriverDTO): Promise<UseCaseResult<Driver>> {
    try {
      const validationResult = this.validate(data);
      if (!validationResult.success) {
        return validationResult;
      }

      const result = await this.driverRepository.create(data);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }

      return {
        success: false,
        error: {
          code: "CREATE_DRIVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al crear el conductor",
        },
      };
    }
  }

  /**
   * Validación sync local (sin round-trips). Unicidad de licencia la resuelve la API.
   */
  private validate(data: CreateDriverDTO): UseCaseResult<Driver> {
    if (!data.employeeId) {
      return {
        success: false,
        error: {
          code: "MISSING_EMPLOYEE_ID",
          message: "El ID del empleado es requerido",
        },
      };
    }

    const federalNumber = data.federalLicenseNumber?.trim();
    const stateNumber = data.stateLicenseNumber?.trim();

    if (!federalNumber && !stateNumber) {
      return {
        success: false,
        error: {
          code: "MISSING_LICENSE",
          message: "Registra al menos una licencia federal o estatal",
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
export function createCreateDriverUseCase(
  driverRepository: IDriverRepository,
): CreateDriverUseCase {
  return new CreateDriverUseCase(driverRepository);
}
