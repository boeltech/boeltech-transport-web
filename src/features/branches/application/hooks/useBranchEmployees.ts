import { useQuery } from "@tanstack/react-query";
import { branchEmployeeQueryKeys } from "../../domain";
import { branchEmployeesApi } from "../../infrastructure/branchEmployeesApi";

export function useBranchEmployees(branchId: string) {
  return useQuery({
    queryKey: branchEmployeeQueryKeys.byBranch(branchId),
    queryFn: () => branchEmployeesApi.listByBranch(branchId),
    enabled: Boolean(branchId),
    staleTime: 30_000,
  });
}
