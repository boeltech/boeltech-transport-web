import type { ApprovalConcept } from "../domain/entities";

export const approvalPoliciesQueryKeys = {
  all: ["approval-policies"] as const,
  overview: () => [...approvalPoliciesQueryKeys.all, "overview"] as const,
  versions: (concept: ApprovalConcept, page: number) =>
    [...approvalPoliciesQueryKeys.all, "versions", concept, page] as const,
  candidateUsers: () => [...approvalPoliciesQueryKeys.all, "candidate-users"] as const,
};
