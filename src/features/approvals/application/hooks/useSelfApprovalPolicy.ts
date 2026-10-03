import { useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import {
  getSelfActionForbiddenError,
  isOwnRecord,
  resolveSelfActionUi,
  type SelfActionForbiddenError,
  type SelfActionUi,
  type SelfApprovalConcept,
} from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

export const SELF_APPROVAL_POLICY_STALE_TIME_MS = 30_000;

export function useSelfApprovalPolicy() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.selfApprovalPolicy(),
    queryFn: () => approvalsApi.getSelfApprovalPolicy(),
    enabled: canRead,
    staleTime: SELF_APPROVAL_POLICY_STALE_TIME_MS,
  });
}

export function invalidateSelfApprovalPolicy(
  queryClient: QueryClient,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: approvalsQueryKeys.selfApprovalPolicy(),
  });
}

/**
 * Resolver de UI de autoacción para un concepto con el usuario en sesión.
 * Recibe los ids de maker del registro (creador/solicitante).
 */
export function useSelfActionResolver(concept: SelfApprovalConcept) {
  const { user } = useAuth();
  const { data: policy } = useSelfApprovalPolicy();
  const userId = user?.id;
  return useCallback(
    (makerIds: ReadonlyArray<string | null | undefined>): SelfActionUi =>
      resolveSelfActionUi({
        isOwn: isOwnRecord(userId, makerIds),
        policy: policy?.[concept],
      }),
    [concept, policy, userId],
  );
}

/**
 * Ante un 403 de autoacción refresca la política (el rol o los autorizadores
 * pudieron cambiar) y devuelve el error reconocido para el toast de respaldo.
 */
export function useSelfActionForbiddenHandler() {
  const queryClient = useQueryClient();
  return useCallback(
    (error: unknown): SelfActionForbiddenError | null => {
      const forbidden = getSelfActionForbiddenError(error);
      if (forbidden) void invalidateSelfApprovalPolicy(queryClient);
      return forbidden;
    },
    [queryClient],
  );
}
