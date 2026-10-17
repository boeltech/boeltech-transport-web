/**
 * useDashboardActivation — GET /dashboard/activation (F1 checklist).
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { dashboardApi } from "../../infrastructure/dashboardApi";
import { dashboardQueryKeys } from "../dashboardQueryKeys";

export function useDashboardActivation(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: dashboardQueryKeys.activation(),
    queryFn: () => dashboardApi.getActivation(),
    enabled: isAuthenticated && enabled,
    staleTime: 60_000,
  });
}
