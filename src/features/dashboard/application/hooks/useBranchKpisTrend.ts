import { useQuery } from "@tanstack/react-query";
import { devRefetchIntervalMs } from "@/shared/config/devPolling";
import { useAuth } from "@/features/auth";
import { dashboardApi } from "../../infrastructure/dashboardApi";
import { dashboardQueryKeys } from "./useDashboard";

export interface UseBranchKpisTrendParams {
  months: number;
  branchIds?: string[];
  includeUnassigned?: boolean;
  enabled?: boolean;
}

export function useBranchKpisTrend(params: UseBranchKpisTrendParams) {
  const { isAuthenticated } = useAuth();
  const branchIds = params.branchIds;
  const includeUnassigned = params.includeUnassigned ?? false;
  const months = params.months;
  const enabled = params.enabled ?? true;
  const hasSelection =
    (branchIds?.length ?? 0) > 0 || includeUnassigned;

  return useQuery({
    queryKey: dashboardQueryKeys.branchKpisTrend(
      months,
      branchIds,
      includeUnassigned,
    ),
    queryFn: () =>
      dashboardApi.getBranchKpisTrend({
        months,
        branchIds,
        includeUnassigned,
      }),
    enabled: isAuthenticated && enabled && hasSelection,
    staleTime: 60_000,
    refetchInterval: devRefetchIntervalMs(isAuthenticated ? 60_000 : false),
  });
}
