/**
 * useDashboard Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener datos del dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
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
};

// ============================================
// Hook
// ============================================

/**
 * Hook para obtener datos del dashboard.
 * Refresca cada 60 segundos para mantener alertas actualizadas.
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.all,
    queryFn: dashboardApi.get,
    staleTime: 60_000, // 1 minuto
    refetchInterval: 60_000, // Auto-refresh cada minuto
  });
}
