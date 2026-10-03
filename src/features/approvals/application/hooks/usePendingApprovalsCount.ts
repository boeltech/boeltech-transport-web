import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import type { ApprovableType, ApprovalQueue } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

export interface PendingApprovalsCountOptions {
  enabled?: boolean;
  /** CEO-3: por defecto «Me toca» (badge global, tarjetas). */
  queue?: ApprovalQueue;
}

export function usePendingApprovalsCount(
  typeOrOptions?: ApprovableType | PendingApprovalsCountOptions,
  maybeOptions?: PendingApprovalsCountOptions,
) {
  const type = typeof typeOrOptions === "string" ? typeOrOptions : undefined;
  const options = typeof typeOrOptions === "object" ? typeOrOptions : maybeOptions;
  const queue = options?.queue ?? "mine";
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.pendingCount(type, queue),
    queryFn: () => approvalsApi.getPendingCount(type, queue),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

export function useApprovalsPendingCountsByType(
  options?: PendingApprovalsCountOptions,
) {
  const queue = options?.queue ?? "mine";
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.pendingCountsByType(queue),
    queryFn: () => approvalsApi.getAllPendingCounts(queue),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}
