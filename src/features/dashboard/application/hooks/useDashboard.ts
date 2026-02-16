import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import type { DashboardData } from "@features/dashboard/types";

const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>("/dashboard");
    return response;
  },
};

/**
 * Hook para obtener datos del dashboard.
 * Refresca cada 60 segundos para mantener alertas actualizadas.
 */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.get,
    staleTime: 60_000, // 1 minuto
    refetchInterval: 60_000, // Auto-refresh cada minuto
  });
}
