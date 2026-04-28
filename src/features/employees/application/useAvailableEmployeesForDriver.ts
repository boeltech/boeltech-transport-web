/**
 * useAvailableEmployeesForDriver Hook
 * Clean Architecture - Application Layer
 *
 * Hook de React Query para obtener empleados disponibles
 * para ser registrados como conductores.
 */

import { useQuery } from "@tanstack/react-query";
import { employeeRepository } from "../infrastructure/employeeRepository";
import { mapApiToEmployeeList } from "../infrastructure/mappers";
import type {
  EmployeeForSelection,
  EmployeeSearchParams,
} from "../domain/entities";

// ============================================================================
// Query Keys
// ============================================================================

export const employeeQueryKeys = {
  all: ["employees"] as const,
  availableForDriver: (search?: string) =>
    [...employeeQueryKeys.all, "available-for-driver", { search }] as const,
  basic: (id: string) => [...employeeQueryKeys.all, "basic", id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook para obtener empleados disponibles para ser conductores.
 *
 * @param search - Texto de búsqueda (opcional)
 * @param enabled - Si el query debe ejecutarse (default: true)
 *
 * @example
 * ```tsx
 * const { data: employees, isLoading } = useAvailableEmployeesForDriver();
 *
 * // Con búsqueda
 * const [search, setSearch] = useState("");
 * const { data: employees } = useAvailableEmployeesForDriver(search);
 * ```
 */
export function useAvailableEmployeesForDriver(
  search?: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: employeeQueryKeys.availableForDriver(search),
    queryFn: async (): Promise<EmployeeForSelection[]> => {
      const params: EmployeeSearchParams = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const apiResponse =
        await employeeRepository.getAvailableForDriver(params);
      return mapApiToEmployeeList(apiResponse);
    },
    enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos (antes cacheTime)
  });
}

/**
 * Hook para obtener datos básicos de un empleado.
 *
 * @param employeeId - ID del empleado
 * @param enabled - Si el query debe ejecutarse
 */
export function useEmployeeBasic(employeeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: employeeQueryKeys.basic(employeeId),
    queryFn: async (): Promise<EmployeeForSelection> => {
      const apiResponse = await employeeRepository.getEmployeeBasic(employeeId);
      return {
        id: apiResponse.id,
        employeeNumber: apiResponse.employee_number,
        firstName: apiResponse.first_name,
        lastName: apiResponse.last_name,
        secondLastName: apiResponse.second_last_name,
        fullName: apiResponse.full_name,
        department: apiResponse.department,
        position: apiResponse.position,
        hireDate: apiResponse.hire_date,
      };
    },
    enabled: enabled && !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
