import type { QueryClient } from "@tanstack/react-query";
import { approvalsQueryKeys } from "@features/approvals/domain";
import { settlementsQueryKeys } from "@features/settlements/domain";
import { approvalPoliciesQueryKeys } from "../domain";

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
