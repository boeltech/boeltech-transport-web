/**
 * Employees Module - Public API
 *
 * Módulo mínimo viable para soportar la selección de empleados
 * en el módulo de conductores.
 *
 * TODO: Expandir cuando se implemente el módulo completo de RH.
 */

// Domain
export type {
  EmployeeForSelection,
  ApiEmployeeForDriverSelection,
  EmployeeSearchParams,
} from "./domain/entities";

// Application (Hooks)
export {
  useAvailableEmployeesForDriver,
  useEmployeeBasic,
  employeeQueryKeys,
} from "./application/useAvailableEmployeesForDriver";

// Infrastructure
export { employeeRepository } from "./infrastructure/employeeRepository";
