import type { ApprovalConcept } from "../domain/entities";

export const APPROVAL_POLICIES_PATH = "/settings/approvals";

/** `?concept=` abre directamente la regla de ese concepto. */
export function approvalPoliciesPath(concept?: ApprovalConcept): string {
  return concept ? `${APPROVAL_POLICIES_PATH}?concept=${concept}` : APPROVAL_POLICIES_PATH;
}
