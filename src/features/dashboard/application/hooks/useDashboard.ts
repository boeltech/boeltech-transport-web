/**
 * useDashboard Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener datos del dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { devRefetchIntervalMs } from "@/shared/config/devPolling";
import { useAuth } from "@/features/auth";
import type { DashboardData } from "../../domain/types";

// ============================================
// API
// ============================================

interface ApiResponse {
  success: boolean;
  data: DashboardData;
}

const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const response = await apiClient.get<ApiResponse>("/dashboard");
    return response.data;
  },
};

// ============================================
// Query Keys
// ============================================

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardQueryKeys.all, "stats"] as const,
  tripsByDay: (days: number) =>
    [...dashboardQueryKeys.all, "trips-by-day", days] as const,
  financialTrend: (months: number) =>
    [...dashboardQueryKeys.all, "financial-trend", months] as const,
  branchKpis: (
    branchIds?: string[],
    includeUnassigned?: boolean,
    period: string = "current_month",
  ) =>
    [
      ...dashboardQueryKeys.all,
      "branch-kpis",
      branchIds ?? [],
      includeUnassigned ?? false,
      period,
    ] as const,
  branchKpisTrend: (
    months: number,
    branchIds?: string[],
    includeUnassigned?: boolean,
  ) =>
    [
      ...dashboardQueryKeys.all,
      "branch-kpis-trend",
      months,
      branchIds ?? [],
      includeUnassigned ?? false,
    ] as const,
};

// ============================================
// Hook
// ============================================

/**
 * Hook para obtener datos del dashboard.
 * Refresca cada 60 segundos para mantener alertas actualizadas.
 */
export function useDashboard() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: dashboardQueryKeys.all,
    queryFn: dashboardApi.get,
    enabled: isAuthenticated,
    staleTime: 60_000, // 1 minuto
    refetchInterval: devRefetchIntervalMs(isAuthenticated ? 60_000 : false),
  });
}
