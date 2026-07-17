import { useQuery } from "@tanstack/react-query";
import { devRefetchIntervalMs } from "@/shared/config/devPolling";
import { useAuth } from "@/features/auth";
import {
  DEFAULT_BRANCH_KPIS_PERIOD,
  type BranchKpisPeriodValue,
} from "../../domain/types";
import { dashboardApi } from "../../infrastructure/dashboardApi";
import { dashboardQueryKeys } from "./useDashboard";

export interface UseBranchKpisParams {
  branchIds?: string[];
  includeUnassigned?: boolean;
  period?: BranchKpisPeriodValue;
  enabled?: boolean;
}

export function useBranchKpis(params?: UseBranchKpisParams) {
  const { isAuthenticated } = useAuth();
  const branchIds = params?.branchIds;
  const includeUnassigned = params?.includeUnassigned ?? false;
  const period = params?.period ?? DEFAULT_BRANCH_KPIS_PERIOD;
  const enabled = params?.enabled ?? true;

  return useQuery({
    queryKey: dashboardQueryKeys.branchKpis(
      branchIds,
      includeUnassigned,
      period,
    ),
    queryFn: () =>
      dashboardApi.getBranchKpis({
        branchIds,
        includeUnassigned,
        period,
      }),
    enabled: isAuthenticated && enabled,
    staleTime: 60_000,
    refetchInterval: devRefetchIntervalMs(isAuthenticated ? 60_000 : false),
  });
}
