/**
 * Employee Entities
 * Clean Architecture - Domain Layer
 *
 * Tipos para el módulo de empleados.
 * Por ahora solo se usa para el selector de empleados en drivers.
 */

// ============================================================================
// API Response Types (snake_case del backend)
// ============================================================================

/**
 * Empleado disponible para ser registrado como conductor.
 * Respuesta del endpoint GET /api/v1/employees/available-for-driver
 */
export interface ApiEmployeeForDriverSelection {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  second_last_name: string | null;
  full_name: string;
  department: string | null;
  position: string | null;
  hire_date: string;
}

// ============================================================================
// Domain Types (camelCase para uso interno)
// ============================================================================

/**
 * Empleado disponible para selector (formato interno)
 */
export interface EmployeeForSelection {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  department: string | null;
  position: string | null;
  hireDate: string;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Convierte respuesta API a formato interno
 */
export function mapApiToEmployee(
  api: ApiEmployeeForDriverSelection,
): EmployeeForSelection {
  return {
    id: api.id,
    employeeNumber: api.employee_number,
    firstName: api.first_name,
    lastName: api.last_name,
    secondLastName: api.second_last_name,
    fullName: api.full_name,
    department: api.department,
    position: api.position,
    hireDate: api.hire_date,
  };
}

/**
 * Convierte lista de respuestas API a formato interno
 */
export function mapApiToEmployeeList(
  apiList: ApiEmployeeForDriverSelection[],
): EmployeeForSelection[] {
  return apiList.map(mapApiToEmployee);
}

// ============================================================================
// Query Params
// ============================================================================

export interface EmployeeSearchParams {
  search?: string;
}
