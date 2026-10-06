import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/application";
import { dashboardQueryKeys } from "@features/dashboard/application/hooks/useDashboard";
import { invalidateNotificationsQueries } from "@features/notifications/application";
// F3 ADR-0102: mover a módulo hoja
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import { tripQueryKeys } from "@features/trips/domain";
import { approvalsQueryKeys } from "./approvalsQueryKeys";

export function invalidateApprovalsRelatedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: approvalsQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  invalidateNotificationsQueries(queryClient);
}
