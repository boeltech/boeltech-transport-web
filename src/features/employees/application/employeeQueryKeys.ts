import type { EmployeeListParams } from "../infrastructure/employeeRepository";

/**
 * Única fuente de query keys de empleados (evitar duplicar en hooks legacy).
 */
export const employeeQueryKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeQueryKeys.all, "list"] as const,
  list: (params: EmployeeListParams) =>
    [...employeeQueryKeys.lists(), params] as const,
  details: () => [...employeeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  availableForDriver: (search?: string, position?: string) =>
    [
      ...employeeQueryKeys.all,
      "available-for-driver",
      { search, position },
    ] as const,
  basic: (id: string) => [...employeeQueryKeys.all, "basic", id] as const,
};
