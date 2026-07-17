import { useQuery } from "@tanstack/react-query";
import { branchEmployeesApi } from "../../infrastructure/branchEmployeesApi";

export const branchEmployeeQueryKeys = {
  byBranch: (branchId: string) => ["branches", "employees", branchId] as const,
};

export function useBranchEmployees(branchId: string) {
  return useQuery({
    queryKey: branchEmployeeQueryKeys.byBranch(branchId),
    queryFn: () => branchEmployeesApi.listByBranch(branchId),
    enabled: Boolean(branchId),
    staleTime: 30_000,
  });
}
