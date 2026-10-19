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
import { mapDashboard } from "../../infrastructure/mappers";

// ============================================
// API
// ============================================

interface ApiResponse {
  success: boolean;
  data: Record<string, unknown>;
}

const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const response = await apiClient.get<ApiResponse>("/dashboard");
    return mapDashboard(response.data ?? {});
  },
};

export { dashboardQueryKeys } from "../dashboardQueryKeys";
import { dashboardQueryKeys } from "../dashboardQueryKeys";

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
