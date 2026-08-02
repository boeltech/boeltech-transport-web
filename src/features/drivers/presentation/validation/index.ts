/**
 * Driver Presentation Layer - Validation Barrel Export
 * Clean Architecture - Presentation Layer
 *
 * Exporta esquemas de validación y tipos del módulo de conductores.
 *
 * Ubicación: src/features/drivers/presentation/validation/index.ts
 */

export {
  driverSchema,
  type DriverFormData,
  defaultDriverFormValues,
  MEXICAN_STATES,
  LICENSE_TYPES,
  driverFormDataToCreateDriverDTO,
  driverFormDataToUpdateDriverDTO,
} from "./driverSchema";
