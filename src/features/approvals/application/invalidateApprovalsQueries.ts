import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/application";
import { dashboardQueryKeys } from "@features/dashboard/application/hooks/useDashboard";
import { invalidateNotificationsQueries } from "@features/notifications";
import { approvalsQueryKeys } from "./approvalsQueryKeys";

export function invalidateApprovalsRelatedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: approvalsQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  invalidateNotificationsQueries(queryClient);
}
