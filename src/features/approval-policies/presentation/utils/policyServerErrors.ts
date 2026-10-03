/**
 * Traduce el 422 de guardado (violaciones de forma/satisfacibilidad o issues
 * Zod) a errores ubicados en el formulario (`tiers.i.steps.j`).
 */
import type { SatisfiabilityIssue, SavePolicyError } from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import { serverIssuePathToField } from "../validation/approvalPolicySchema";

const v = approvalPoliciesCopy.validation;

export interface PlacedPolicyError {
  /** Ruta RHF o `null` si solo va al resumen. */
  readonly field: string | null;
  readonly message: string;
}

function messageForViolation(issue: SatisfiabilityIssue, distinctSigners: (tierIndex: number) => number): string {
  switch (issue.reason) {
    case "no_eligible":
      return v.noEligible(v.noEligibleReason);
    case "double_sign_needs_two_people":
      return v.doubleSign(distinctSigners(issue.tierIndex));
    case "step_empty":
    case "STEP_EMPTY":
    case "steps_required":
      return v.stepEmpty;
    case "role_outside_ceiling":
      return v.roleOutsideCeiling;
    case "unknown_user":
    case "eligible_user_ids_mismatch":
      return v.unknownUser;
    case "missing_base_tier":
      return v.baseTier;
    case "approval_required_for_concept":
      return v.approvalRequired;
    default:
      return v.generic;
  }
}

function fieldForViolation(issue: SatisfiabilityIssue): string | null {
  if (issue.tierIndex < 0) return null;
  if (issue.stepNo >= 1) return `tiers.${issue.tierIndex}.steps.${issue.stepNo - 1}`;
  return `tiers.${issue.tierIndex}`;
}

export function placeSavePolicyErrors(
  error: SavePolicyError,
  distinctSigners: (tierIndex: number) => number,
): PlacedPolicyError[] {
  const placed: PlacedPolicyError[] = error.violations.map((issue) => ({
    field: fieldForViolation(issue),
    message: messageForViolation(issue, distinctSigners),
  }));
  for (const issue of error.issues) {
    placed.push({
      field: serverIssuePathToField(issue.path),
      message: issue.message === "STEP_EMPTY" ? v.stepEmpty : v.generic,
    });
  }
  if (placed.length === 0 && error.message) placed.push({ field: null, message: error.message });
  return placed;
}
