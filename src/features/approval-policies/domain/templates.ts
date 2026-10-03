/**
 * Plantillas de arranque del editor (ADR-0099 UX2). Producen un borrador
 * editable; nunca se guardan sin pasar por el Sheet.
 */
import { ROLES, type UserRole } from "@shared/constants/roles";
import {
  APPROVAL_RULES_SCHEMA_VERSION,
  conceptAllowsNoApprovalTier,
  type ApprovalConcept,
  type ApprovalRules,
  type ApprovalTier,
  type PolicyCandidateUser,
} from "./entities";
import { ceilingUsers, getConceptCeilingRoles } from "./eligibility";

export const POLICY_TEMPLATE_IDS = ["oneApprover", "byAmount", "doubleSign"] as const;
export type PolicyTemplateId = (typeof POLICY_TEMPLATE_IDS)[number];

/** Monto a partir del cual «Por monto» y «Doble firma» suben el control. */
export const TEMPLATE_HIGH_AMOUNT_MXN = 20_000;

export interface TemplateContext {
  readonly concept: ApprovalConcept;
  /**
   * Umbral VoBo vigente (solo liquidaciones). Si es > 0 se preserva como
   * primer tramo «sin autorización» (SDD §3.10).
   */
  readonly settlementThresholdMxn?: number;
}

function step(roles: UserRole[]) {
  return { eligibleRoles: roles, eligibleUserIds: [] as string[] };
}

function baseTiers(context: TemplateContext): { tiers: ApprovalTier[]; approvalFloor: number } {
  const threshold = context.settlementThresholdMxn ?? 0;
  if (conceptAllowsNoApprovalTier(context.concept) && threshold > 0) {
    return {
      tiers: [{ minAmount: 0, conditions: {}, requiresApproval: false, steps: [] }],
      approvalFloor: threshold,
    };
  }
  return { tiers: [], approvalFloor: 0 };
}

function highAmount(approvalFloor: number): number {
  return approvalFloor >= TEMPLATE_HIGH_AMOUNT_MXN ? approvalFloor * 2 : TEMPLATE_HIGH_AMOUNT_MXN;
}

function rules(tiers: ApprovalTier[]): ApprovalRules {
  return { rulesSchemaVersion: APPROVAL_RULES_SCHEMA_VERSION, tiers };
}

export function buildPolicyTemplate(id: PolicyTemplateId, context: TemplateContext): ApprovalRules {
  const ceiling = getConceptCeilingRoles(context.concept);
  const { tiers, approvalFloor } = baseTiers(context);
  const approverTier = (minAmount: number, roles: UserRole[], steps = 1): ApprovalTier => ({
    minAmount,
    conditions: {},
    requiresApproval: true,
    steps: Array.from({ length: steps }, () => step([...roles])),
  });

  switch (id) {
    case "oneApprover":
      return rules([...tiers, approverTier(approvalFloor, ceiling)]);
    case "byAmount": {
      const withoutAdmin = ceiling.filter((role) => role !== ROLES.ADMIN);
      const lower = withoutAdmin.length > 0 ? withoutAdmin : ceiling;
      return rules([
        ...tiers,
        approverTier(approvalFloor, lower),
        approverTier(highAmount(approvalFloor), [ROLES.ADMIN]),
      ]);
    }
    case "doubleSign":
      return rules([
        ...tiers,
        approverTier(approvalFloor, ceiling),
        approverTier(highAmount(approvalFloor), ceiling, 2),
      ]);
  }
}

export interface TemplateAvailability {
  readonly available: boolean;
  /** Motivo legible cuando no aplica. */
  readonly reason?: string;
}

/**
 * Una plantilla que el equipo no puede cumplir se muestra deshabilitada
 * con motivo (UX2). `users` = activos del tenant; `null` si no se conocen.
 */
export function templateAvailability(
  id: PolicyTemplateId,
  concept: ApprovalConcept,
  users: readonly PolicyCandidateUser[] | null,
): TemplateAvailability {
  if (id === "doubleSign" && concept === "disbursement") {
    return { available: false, reason: "La dispersión admite un solo paso de autorización" };
  }
  if (users === null) return { available: true };
  const inCeiling = ceilingUsers(concept, users);
  if (id === "doubleSign" && inCeiling.length < 2) {
    return {
      available: false,
      reason: `Requiere 2 autorizadores activos; tienes ${inCeiling.length}`,
    };
  }
  if (id === "byAmount" && !inCeiling.some((user) => user.role === ROLES.ADMIN)) {
    return { available: false, reason: "Requiere un administrador activo" };
  }
  if (inCeiling.length === 0) {
    return { available: false, reason: "No hay autorizadores activos" };
  }
  return { available: true };
}
