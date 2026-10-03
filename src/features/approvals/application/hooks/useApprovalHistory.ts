import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import type { ApprovableType } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

/** ADR-0099 «Ver historial»: solo se pide al abrir el panel. */
export function useApprovalHistory(
  type: ApprovableType | null | undefined,
  id: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.history(type ?? "", id ?? ""),
    queryFn: () => approvalsApi.history(type as ApprovableType, id as string),
    enabled: canRead && Boolean(type && id) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}
