/**
 * Reglas de autorización por tenant (ADR-0099) — tipos de dominio (camelCase).
 * Contrato: `GET/PUT /approval-policies` (SDD §3.9). El API es la autoridad;
 * aquí solo vive la forma que el web lee y edita.
 */
import type { UserRole } from "@shared/constants/roles";

export const APPROVAL_CONCEPTS = [
  "driver_advance",
  "trip_expense",
  "settlement",
  "disbursement",
] as const;
export type ApprovalConcept = (typeof APPROVAL_CONCEPTS)[number];

export const APPROVAL_RULES_SCHEMA_VERSION = 1 as const;
export const APPROVAL_MAX_TIERS = 4;
export const APPROVAL_MAX_STEPS = 2;

export type ApprovalConditionKey = "category" | "missingCfdi" | "manualAdjustments";

/** Condiciones de lista cerrada por concepto (ADR-0099 D2). */
export const CONDITIONS_BY_CONCEPT: Record<ApprovalConcept, readonly ApprovalConditionKey[]> = {
  driver_advance: ["category"],
  trip_expense: ["category", "missingCfdi"],
  settlement: ["manualAdjustments"],
  disbursement: [],
};

export function isApprovalConcept(value: unknown): value is ApprovalConcept {
  return typeof value === "string" && (APPROVAL_CONCEPTS as readonly string[]).includes(value);
}

/** Solo liquidaciones admite tramos «sin autorización» (umbral VoBo). */
export function conceptAllowsNoApprovalTier(concept: ApprovalConcept): boolean {
  return concept === "settlement";
}

/** La dispersión tiene un solo paso por tramo. */
export function conceptMaxSteps(concept: ApprovalConcept): number {
  return concept === "disbursement" ? 1 : APPROVAL_MAX_STEPS;
}

export interface ApprovalRuleStep {
  readonly eligibleRoles: UserRole[];
  readonly eligibleUserIds: string[];
}

export interface ApprovalTierConditions {
  readonly categories?: string[];
  readonly missingCfdi?: true;
  readonly manualAdjustments?: true;
}

export interface ApprovalTier {
  readonly minAmount: number;
  readonly conditions: ApprovalTierConditions;
  readonly requiresApproval: boolean;
  readonly steps: ApprovalRuleStep[];
}

export interface ApprovalRules {
  readonly rulesSchemaVersion: typeof APPROVAL_RULES_SCHEMA_VERSION;
  readonly tiers: ApprovalTier[];
}

/** `system_default` = el tenant no tiene versión propia del concepto. */
export type ConceptPolicySource = "system_default" | "tenant" | "system_default_reset";

export interface ConceptPolicy {
  readonly concept: ApprovalConcept;
  readonly source: ConceptPolicySource;
  readonly version: number | null;
  /** ISO 8601. */
  readonly effectiveFrom: string | null;
  readonly createdBy: string | null;
  readonly createdByName: string | null;
  readonly rules: ApprovalRules;
  readonly summary: string;
  readonly pendingRequests: number;
  /**
   * Umbral VoBo de la regla vigente, calculado por el API (addendum ADR-0099 A4, rev. 0.2).
   * En liquidaciones: número = piden autorización los pagos desde ese monto (`0` = todos);
   * `null` = ningún tramo sin condiciones pide autorización (solo las correcciones manuales).
   * En los demás conceptos siempre `null`.
   * `undefined` = el API no envió el campo (anterior a F1); la UI no muestra línea de umbral.
   */
  readonly voboThresholdMxn?: number | null;
  /**
   * Monto al que vuelve «Restablecer estándar» en liquidaciones (rev. 0.2), en estado
   * estándar y personalizado. `null` en los demás conceptos; `undefined` = el API no lo envió.
   */
  readonly standardVoboThresholdMxn?: number | null;
}

export interface ApprovalPoliciesOverview {
  readonly editEnabled: boolean;
  readonly concepts: ConceptPolicy[];
}

export type SatisfiabilityReason = "no_eligible" | "double_sign_needs_two_people";

export interface SatisfiabilityIssue {
  readonly tierIndex: number;
  readonly stepNo: number;
  readonly reason: SatisfiabilityReason | "single_eligible" | string;
}

export interface SavedPolicyVersion {
  readonly concept: ApprovalConcept;
  readonly source: Exclude<ConceptPolicySource, "system_default">;
  readonly version: number;
  readonly effectiveFrom: string | null;
  readonly createdBy: string;
  readonly rules: ApprovalRules;
  readonly summary: string;
  readonly warnings: SatisfiabilityIssue[];
}

export type PolicyDiffField =
  | "tiers_count"
  | "min_amount"
  | "requires_approval"
  | "steps"
  | "conditions";

export interface PolicyDiffEntry {
  readonly field: PolicyDiffField | string;
  readonly tierIndex: number | null;
  readonly stepNo: number | null;
  readonly from: unknown;
  readonly to: unknown;
}

export interface PolicyVersionItem {
  readonly version: number;
  readonly effectiveFrom: string | null;
  readonly createdBy: string;
  readonly createdByName: string | null;
  readonly source: Exclude<ConceptPolicySource, "system_default">;
  readonly diffSummary: PolicyDiffEntry[];
}

export interface PolicyVersionPage {
  readonly items: PolicyVersionItem[];
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
}

export interface SimulationFacts {
  readonly amount: number;
  readonly category?: string | null;
  readonly missingCfdi?: boolean;
  readonly manualAdjustments?: boolean;
}

export interface SimulationEligibleUser {
  readonly userId: string;
  readonly fullName: string;
  readonly role: string;
}

export interface SimulationResult {
  readonly requiresApproval: boolean;
  readonly tierIndex: number;
  readonly steps: Array<{ stepNo: number; eligible: SimulationEligibleUser[] }>;
  readonly violations: SatisfiabilityIssue[];
}

/** Usuario activo del tenant que podría quedar elegible en un paso. */
export interface PolicyCandidateUser {
  readonly id: string;
  readonly fullName: string;
  readonly role: UserRole;
}

/**
 * Nombrado en un paso de una versión vigente que hoy no puede firmar:
 * inactivo, suspendido o activo con rol fuera del techo. Nunca es elegible.
 */
export interface PolicyReferencedUser extends PolicyCandidateUser {
  readonly status: string;
}

/** `GET /approval-policies/candidates` (TEC-7). */
export interface PolicyCandidates {
  /** Activos con rol dentro del techo de algún concepto; única fuente de elegibles. */
  readonly users: PolicyCandidateUser[];
  readonly referencedUsers: PolicyReferencedUser[];
}

/** Cómo se muestra una persona designada en un paso. */
export type DesignatedPersonState =
  | "eligible"
  | "inactive"
  | "pending_activation"
  | "suspended"
  | "no_permission"
  | "unavailable";

export interface DesignatedPerson {
  readonly id: string;
  /** `null` = el usuario ya no existe en el tenant. */
  readonly fullName: string | null;
  readonly state: DesignatedPersonState;
}

/** Detalle del 409 `APPROVAL_POLICY_ORPHAN_GUARD` al cambiar un usuario. */
export interface PolicyOrphanViolation {
  readonly concept: ApprovalConcept | string;
  readonly policyVersion: number | null;
  readonly tierIndex: number;
  readonly stepNo: number;
  readonly reason: SatisfiabilityReason | string;
}
