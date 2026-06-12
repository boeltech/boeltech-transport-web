import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

export function usePendingApprovalsCount(options?: { enabled?: boolean }) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.pendingCount(),
    queryFn: () => approvalsApi.getPendingCount(),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
