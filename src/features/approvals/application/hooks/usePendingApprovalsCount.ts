import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import type { ApprovableType } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

export function usePendingApprovalsCount(
  typeOrOptions?: ApprovableType | { enabled?: boolean },
  maybeOptions?: { enabled?: boolean },
) {
  const type = typeof typeOrOptions === "string" ? typeOrOptions : undefined;
  const options = typeof typeOrOptions === "object" ? typeOrOptions : maybeOptions;
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.pendingCount(type),
    queryFn: () => approvalsApi.getPendingCount(type),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

export function useApprovalsPendingCountsByType(options?: { enabled?: boolean }) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.pendingCountsByType(),
    queryFn: () => approvalsApi.getAllPendingCounts(),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}
