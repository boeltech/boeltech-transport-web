import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/application/financeQueryKeys";
import { dashboardQueryKeys } from "@features/dashboard/application/dashboardQueryKeys";
import { invalidateNotificationsQueries } from "@features/notifications/application";
// F3 ADR-0102: mover a módulo hoja
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import { tripQueryKeys } from "@features/trips/application/tripsQueryKeys";
import { approvalsQueryKeys } from "./approvalsQueryKeys";

/**
 * Contrato post-decisión de aprobación (fan-out más amplio del ERP).
 * Invalida: bandeja, finance, dashboard, liquidaciones, viajes, notificaciones.
 * Preferir este helper a listas ad hoc en hooks de mutación.
 */
export function invalidateApprovalsRelatedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: approvalsQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  invalidateNotificationsQueries(queryClient);
}
