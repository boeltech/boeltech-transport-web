import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  getAvailableForDriver,
  getEmployeeBasic,
  type EmployeeListParams,
} from "../../infrastructure/employeeRepository";
import {
  mapPaginatedEmployees,
  mapEmployee,
  mapApiToEmployeeForSelection,
  mapApiToEmployeeList,
} from "../../infrastructure/mappers";
import type {
  EmployeeListItem,
  Employee,
  EmployeeForSelection,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  TerminateEmployeeDTO,
  EmployeeSearchParams,
} from "../../domain/entities";
import type { MappedPaginatedResult, MappedSingleResult } from "@shared/api";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const employeeQueryKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeQueryKeys.all, "list"] as const,
  list: (params: EmployeeListParams) =>
    [...employeeQueryKeys.lists(), params] as const,
  details: () => [...employeeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  availableForDriver: (search?: string) =>
    [...employeeQueryKeys.all, "available-for-driver", { search }] as const,
  basic: (id: string) => [...employeeQueryKeys.all, "basic", id] as const,
};

// ============================================================================
// LIST HOOK
// ============================================================================

export function useEmployees(params: EmployeeListParams = {}) {
  return useQuery<MappedPaginatedResult<EmployeeListItem>>({
    queryKey: employeeQueryKeys.list(params),
    queryFn: async () => {
      const raw = await fetchEmployees(params);
      return mapPaginatedEmployees(raw);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// DETAIL HOOK
// ============================================================================

export function useEmployee(id: string, enabled = true) {
  return useQuery<MappedSingleResult<Employee>>({
    queryKey: employeeQueryKeys.detail(id),
    queryFn: async () => {
      const raw = await fetchEmployee(id);
      return mapEmployee(raw);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// DRIVER SELECTION HOOKS (legacy)
// ============================================================================

export function useAvailableEmployeesForDriver(
  search?: string,
  enabled = true,
) {
  return useQuery<EmployeeForSelection[]>({
    queryKey: employeeQueryKeys.availableForDriver(search),
    queryFn: async () => {
      const params: EmployeeSearchParams = {};
      if (search?.trim()) params.search = search.trim();
      const raw = await getAvailableForDriver(params);
      return mapApiToEmployeeList(raw);
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useEmployeeBasic(employeeId: string, enabled = true) {
  return useQuery<EmployeeForSelection>({
    queryKey: employeeQueryKeys.basic(employeeId),
    queryFn: async () => {
      const raw = await getEmployeeBasic(employeeId);
      return mapApiToEmployeeForSelection(raw);
    },
    enabled: enabled && !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// CREATE MUTATION
// ============================================================================

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEmployeeDTO) => {
      const raw = await createEmployee(data);
      return mapEmployee(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.availableForDriver(),
      });
    },
  });
}

// ============================================================================
// UPDATE MUTATION
// ============================================================================

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateEmployeeDTO) => {
      const raw = await updateEmployee(id, data);
      return mapEmployee(raw);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.setQueryData(employeeQueryKeys.detail(id), result);
    },
  });
}

// ============================================================================
// TERMINATE MUTATION
// ============================================================================

export function useTerminateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TerminateEmployeeDTO;
    }) => {
      await terminateEmployee(id, data);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.availableForDriver(),
      });
    },
  });
}
