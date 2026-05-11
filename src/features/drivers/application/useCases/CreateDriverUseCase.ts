/**
 * CreateDriverUseCase
 * Clean Architecture - Application Layer
 *
 * Caso de uso para crear un nuevo conductor.
 */

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
      // Validaciones de negocio
      const validationResult = await this.validate(data);
      if (!validationResult.success) {
        return validationResult;
      }

      // Crear conductor
      const result = await this.driverRepository.create(data);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("[CreateDriverUseCase] Error:", error);

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
   * Valida los datos antes de crear
   */
  private async validate(
    data: CreateDriverDTO,
  ): Promise<UseCaseResult<Driver>> {
    // Validar campos requeridos
    if (!data.employeeId) {
      return {
        success: false,
        error: {
          code: "MISSING_EMPLOYEE_ID",
          message: "El ID del empleado es requerido",
        },
      };
    }

    if (!data.licenseNumber) {
      return {
        success: false,
        error: {
          code: "MISSING_LICENSE_NUMBER",
          message: "El número de licencia es requerido",
        },
      };
    }

    if (!data.licenseType) {
      return {
        success: false,
        error: {
          code: "MISSING_LICENSE_TYPE",
          message: "El tipo de licencia es requerido",
        },
      };
    }

    if (!data.licenseExpiry) {
      return {
        success: false,
        error: {
          code: "MISSING_LICENSE_EXPIRY",
          message: "La fecha de vencimiento de licencia es requerida",
        },
      };
    }

    // Verificar que el número de licencia no esté en uso
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

    // Validación exitosa (retornamos un objeto vacío que será ignorado)
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
