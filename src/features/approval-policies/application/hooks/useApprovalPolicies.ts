import { useCallback, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalsQueryKeys } from "@features/approvals/application/approvalsQueryKeys";
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import type {
  ApprovalConcept,
  ApprovalRules,
  PolicyOrphanViolation,
  SimulationFacts,
} from "../../domain/entities";
import { getPolicyOrphanGuardError } from "../../domain/policyErrors";
import { approvalPoliciesApi, type SavePolicyInput } from "../../infrastructure/approvalPoliciesApi";
import { approvalPoliciesQueryKeys } from "../approvalPoliciesQueryKeys";

export function useApprovalPolicies() {
  return useQuery({
    queryKey: approvalPoliciesQueryKeys.overview(),
    queryFn: approvalPoliciesApi.getOverview,
    staleTime: 30_000,
  });
}

/** Autorizadores posibles y referenciados en reglas vigentes (solo editores). */
export function usePolicyCandidateUsers(options: { enabled: boolean }) {
  return useQuery({
    queryKey: approvalPoliciesQueryKeys.candidateUsers(),
    queryFn: approvalPoliciesApi.listCandidateUsers,
    staleTime: 60_000,
    enabled: options.enabled,
  });
}

export function usePolicyVersions(concept: ApprovalConcept | null, page: number) {
  return useQuery({
    queryKey: approvalPoliciesQueryKeys.versions(concept ?? "settlement", page),
    queryFn: () => approvalPoliciesApi.listVersions(concept as ApprovalConcept, page),
    enabled: concept !== null,
    placeholderData: keepPreviousData,
  });
}

/**
 * Guardar o restablecer cambia quién aprueba las solicitudes nuevas y,
 * en liquidaciones, el umbral derivado (SDD §3.10).
 */
function useInvalidateAfterPolicyChange() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: approvalPoliciesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: approvalsQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.settings() });
  }, [queryClient]);
}

export function useSaveApprovalPolicy() {
  const invalidate = useInvalidateAfterPolicyChange();
  return useMutation({
    mutationFn: (input: SavePolicyInput) => approvalPoliciesApi.save(input),
    onSuccess: invalidate,
  });
}

export function useResetApprovalPolicy() {
  const invalidate = useInvalidateAfterPolicyChange();
  return useMutation({
    mutationFn: ({ concept, expectedVersion }: { concept: ApprovalConcept; expectedVersion: number | null }) =>
      approvalPoliciesApi.reset(concept, expectedVersion),
    onSuccess: invalidate,
  });
}

/** `rules: null` = probar la regla vigente. */
export function useSimulateApprovalPolicy() {
  return useMutation({
    mutationFn: ({
      concept,
      rules,
      facts,
    }: {
      concept: ApprovalConcept;
      rules: ApprovalRules | null;
      facts: SimulationFacts;
    }) => approvalPoliciesApi.simulate(concept, rules, facts),
  });
}

export interface PolicyOrphanDialogState {
  readonly open: boolean;
  readonly message: string | null;
  readonly violations: PolicyOrphanViolation[];
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Confirmación del guard de huérfanos (ADR-0099 D12): si el cambio de
 * usuario deja pasos sin firmante, se muestra el detalle y se reenvía con
 * `confirmPolicyOrphan` solo si el admin confirma.
 */
export function usePolicyOrphanConfirmation() {
  const [pending, setPending] = useState<{
    message: string | null;
    violations: PolicyOrphanViolation[];
    retry: () => void;
  } | null>(null);

  const intercept = useCallback((error: unknown, retry: () => void): boolean => {
    const orphan = getPolicyOrphanGuardError(error);
    if (!orphan) return false;
    setPending({ ...orphan, retry });
    return true;
  }, []);

  const dialog: PolicyOrphanDialogState = {
    open: pending !== null,
    message: pending?.message ?? null,
    violations: pending?.violations ?? [],
    onCancel: () => setPending(null),
    onConfirm: () => {
      const retry = pending?.retry;
      setPending(null);
      retry?.();
    },
  };

  return { intercept, dialog };
}
