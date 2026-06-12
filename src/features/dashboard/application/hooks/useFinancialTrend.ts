import { useQuery } from "@tanstack/react-query";
import { devRefetchIntervalMs } from "@/shared/config/devPolling";
import { useAuth } from "@/features/auth";
import { dashboardApi } from "../../infrastructure/dashboardApi";
import { dashboardQueryKeys } from "./useDashboard";

export function useFinancialTrend(
  months = 12,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: dashboardQueryKeys.financialTrend(months),
    queryFn: () => dashboardApi.getFinancialTrend(months),
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 60_000,
    refetchInterval: devRefetchIntervalMs(isAuthenticated ? 60_000 : false),
  });
}
