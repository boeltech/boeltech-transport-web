/**
 * Diff de versiones en texto (ADR-0099 UX5): «Tramo 2: $15,000 → $20,000».
 */
import type { UserRole } from "@shared/constants/roles";
import {
  describeStep,
  formatPolicyAmount,
  type ApprovalConcept,
  type PolicyDiffEntry,
} from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";

const copy = approvalPoliciesCopy.versions;

function stepText(raw: unknown, concept: ApprovalConcept): string | null {
  if (!raw || typeof raw !== "object") return null;
  const step = raw as { eligible_roles?: unknown; eligible_user_ids?: unknown };
  return describeStep(
    {
      eligibleRoles: (Array.isArray(step.eligible_roles) ? step.eligible_roles : []) as UserRole[],
      eligibleUserIds: (Array.isArray(step.eligible_user_ids) ? step.eligible_user_ids : []) as string[],
    },
    concept,
  );
}

function amountText(raw: unknown): string {
  return typeof raw === "number" ? formatPolicyAmount(raw) : String(raw);
}

export function describePolicyDiffEntry(entry: PolicyDiffEntry, concept: ApprovalConcept): string {
  const tier = entry.tierIndex !== null ? copy.tier(entry.tierIndex + 1) : "";
  switch (entry.field) {
    case "tiers_count":
      return copy.tiersCount(entry.from, entry.to);
    case "min_amount":
      return `${tier}: ${amountText(entry.from)} → ${amountText(entry.to)}`;
    case "requires_approval":
      return `${tier}: ${entry.from ? copy.approvalOn : copy.approvalOff} → ${entry.to ? copy.approvalOn : copy.approvalOff}`;
    case "conditions":
      return `${tier}: ${copy.conditions}`;
    case "steps": {
      const where = entry.stepNo !== null ? `${tier}, ${copy.step(entry.stepNo)}` : tier;
      const from = stepText(entry.from, concept);
      const to = stepText(entry.to, concept);
      if (from && to) return `${where}: ${from} → ${to}`;
      if (to) return `${where}: ${copy.added} (${to})`;
      return `${where}: ${copy.removed}`;
    }
    default:
      return tier || String(entry.field);
  }
}
