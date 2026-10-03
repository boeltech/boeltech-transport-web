/**
 * Resumen en lenguaje natural de una regla (borrador o vigente).
 * Misma redacción que el `summary` del API (`policySummary.ts`), con etiquetas
 * de categoría legibles.
 */
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import type { ApprovalConcept, ApprovalRuleStep, ApprovalRules, ApprovalTier } from "./entities";
import { getConceptCeilingRoles, isUnrestrictedStep } from "./eligibility";

const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function formatPolicyAmount(amount: number): string {
  return MXN.format(amount);
}

export interface SummarizeOptions {
  /** Etiqueta legible de una categoría del concepto. */
  categoryLabel?: (category: string) => string;
}

export function describeStep(step: ApprovalRuleStep, concept: ApprovalConcept): string {
  if (isUnrestrictedStep(step, getConceptCeilingRoles(concept))) {
    return "Cualquier autorizador";
  }
  const parts: string[] = [];
  if (step.eligibleRoles.length > 0) {
    parts.push(step.eligibleRoles.map((role) => ROLE_LABELS[role as UserRole] ?? role).join(" o "));
  }
  const people = step.eligibleUserIds.length;
  if (people > 0) {
    parts.push(people === 1 ? "1 persona designada" : `${people} personas designadas`);
  }
  return parts.join(" o ");
}

export function describeConditions(tier: ApprovalTier, options: SummarizeOptions = {}): string {
  const parts: string[] = [];
  const categories = tier.conditions.categories ?? [];
  if (categories.length > 0) {
    const label = options.categoryLabel ?? ((c: string) => c);
    parts.push(`categorías ${categories.map(label).join(", ")}`);
  }
  if (tier.conditions.missingCfdi === true) parts.push("sin CFDI");
  if (tier.conditions.manualAdjustments === true) parts.push("con ajustes manuales");
  return parts.length > 0 ? ` (${parts.join(" o ")})` : "";
}

export function describeTier(tier: ApprovalTier, concept: ApprovalConcept): string {
  if (!tier.requiresApproval) return "Sin autorización";
  const steps = tier.steps.map((step) => describeStep(step, concept));
  return steps.length === 2 ? `Doble firma: ${steps[0]} → ${steps[1]}` : (steps[0] ?? "");
}

/** Una línea por tramo; un único tramo base se resume sin monto. */
export function summarizeRules(
  rules: ApprovalRules,
  concept: ApprovalConcept,
  options: SummarizeOptions = {},
): string {
  const ordered = [...rules.tiers].sort((a, b) => a.minAmount - b.minAmount);
  const [first] = ordered;
  if (ordered.length === 1 && first && first.minAmount === 0) {
    return describeTier(first, concept) + describeConditions(first, options);
  }
  return ordered
    .map(
      (tier) =>
        `Desde ${formatPolicyAmount(tier.minAmount)}${describeConditions(tier, options)}: ${describeTier(tier, concept)}`,
    )
    .join(" · ");
}
