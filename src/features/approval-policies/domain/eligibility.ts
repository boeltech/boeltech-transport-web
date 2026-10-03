/**
 * Techo RBAC por concepto y conteo en vivo de elegibles (ADR-0099 D3/D6).
 * El techo sale de la matriz web (lockstep con `permissions.ts` del API):
 * una regla solo restringe dentro de esos roles, nunca los amplía.
 */
import type { UserRole } from "@shared/constants/roles";
import {
  checkPermission,
  getAllRoles,
  getPermissionsForRole,
  type Action,
  type Module,
} from "@shared/permissions";
import type {
  ApprovalConcept,
  ApprovalRuleStep,
  PolicyCandidateUser,
} from "./entities";

const CEILING_PERMISSION: Record<ApprovalConcept, { module: Module; action: Action }> = {
  driver_advance: { module: "settlements", action: "update" },
  settlement: { module: "settlements", action: "update" },
  trip_expense: { module: "finance_approvals", action: "update" },
  disbursement: { module: "settlements", action: "execute" },
};

export function getConceptCeilingRoles(concept: ApprovalConcept): UserRole[] {
  const { module, action } = CEILING_PERMISSION[concept];
  return getAllRoles().filter(
    (role) => checkPermission(role, getPermissionsForRole(role), module, action).allowed,
  );
}

/** Paso con todos los roles del techo = «cualquier autorizador». */
export function isUnrestrictedStep(
  step: Pick<ApprovalRuleStep, "eligibleRoles">,
  ceilingRoles: readonly UserRole[],
): boolean {
  return ceilingRoles.every((role) => step.eligibleRoles.includes(role));
}

/** Quienes pueden firmar el paso entre los usuarios activos del techo. */
export function eligibleUsersForStep(
  step: ApprovalRuleStep,
  concept: ApprovalConcept,
  users: readonly PolicyCandidateUser[],
): PolicyCandidateUser[] {
  const ceiling = getConceptCeilingRoles(concept);
  return users.filter(
    (user) =>
      ceiling.includes(user.role) &&
      (step.eligibleRoles.includes(user.role) || step.eligibleUserIds.includes(user.id)),
  );
}

/** Usuarios activos dentro del techo del concepto. */
export function ceilingUsers(
  concept: ApprovalConcept,
  users: readonly PolicyCandidateUser[],
): PolicyCandidateUser[] {
  const ceiling = getConceptCeilingRoles(concept);
  return users.filter((user) => ceiling.includes(user.role));
}

/** Personas distintas que cubren los dos pasos de una doble firma. */
export function distinctSignersForTier(
  steps: readonly ApprovalRuleStep[],
  concept: ApprovalConcept,
  users: readonly PolicyCandidateUser[],
): number {
  const ids = new Set<string>();
  for (const step of steps) {
    for (const user of eligibleUsersForStep(step, concept, users)) ids.add(user.id);
  }
  return ids.size;
}
