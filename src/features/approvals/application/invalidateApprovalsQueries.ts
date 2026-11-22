import type { QueryClient } from "@tanstack/react-query";
import { approvalsQueryKeys } from "@features/approvals/domain";
import { dashboardQueryKeys } from "@features/dashboard/domain";
import { financeQueryKeys } from "@features/finance/domain";
import { scheduleFinanceAnalysisRefresh } from "@features/finance/application/invalidateFinanceAnalysisQueries";
import { invalidateNotificationsQueries } from "@features/notifications/application";
// F3 ADR-0102: mover a módulo hoja (parte B)
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import { tripQueryKeys } from "@features/trips/application/tripsQueryKeys";

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
  scheduleFinanceAnalysisRefresh(queryClient);
}
