import type { QueryClient } from "@tanstack/react-query";
import { approvalsQueryKeys } from "@features/approvals/application/approvalsQueryKeys";
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import { approvalPoliciesQueryKeys } from "./approvalPoliciesQueryKeys";

/**
 * Tras guardar / restablecer una regla: políticas, bandeja y settings de liquidaciones
 * (umbral VoBo derivado — SDD §3.10).
 */
export function invalidateApprovalPoliciesQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: approvalPoliciesQueryKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: approvalsQueryKeys.all });
  void queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.settings(),
  });
}
