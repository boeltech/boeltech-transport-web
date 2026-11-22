/**
 * Invalida el GET /dashboard (stats, trips_today, alerts, …).
 * Usar tras mutaciones de lifecycle de viaje que afectan la banda matutina.
 */

import type { QueryClient } from "@tanstack/react-query";

import { dashboardQueryKeys } from "@features/dashboard/domain";

export function invalidateDashboardLiveQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
}
