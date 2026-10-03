/**
 * Mappers snake_case ↔ camelCase del contrato `/approval-policies` (SDD §3.9).
 */
import type { UserRole } from "@shared/constants/roles";
import {
  APPROVAL_RULES_SCHEMA_VERSION,
  type ApprovalConcept,
  type ApprovalPoliciesOverview,
  type ApprovalRuleStep,
  type ApprovalRules,
  type ApprovalTier,
  type ApprovalTierConditions,
  type ConceptPolicy,
  type ConceptPolicySource,
  type PolicyCandidateUser,
  type PolicyDiffEntry,
  type PolicyVersionPage,
  type SatisfiabilityIssue,
  type SavedPolicyVersion,
  type SimulationFacts,
  type SimulationResult,
} from "../domain/entities";

export interface ApiRuleStep {
  eligible_roles: string[];
  eligible_user_ids: string[];
}

export interface ApiTierConditions {
  categories?: string[];
  missing_cfdi?: true;
  manual_adjustments?: true;
}

export interface ApiTier {
  min_amount: number;
  conditions?: ApiTierConditions;
  requires_approval: boolean;
  steps: ApiRuleStep[];
}

export interface ApiRules {
  rules_schema_version: number;
  tiers: ApiTier[];
}

export interface ApiConceptPolicy {
  concept: ApprovalConcept;
  source: ConceptPolicySource;
  version: number | null;
  effective_from: string | null;
  created_by: string | null;
  created_by_name?: string | null;
  rules: ApiRules;
  summary: string;
  pending_requests?: number;
}

export interface ApiApprovalPoliciesOverview {
  edit_enabled: boolean;
  concepts: ApiConceptPolicy[];
}

export interface ApiSatisfiabilityIssue {
  tier_index: number;
  step_no: number;
  reason: string;
}

export interface ApiSavedPolicyVersion extends Omit<ApiConceptPolicy, "pending_requests"> {
  warnings?: ApiSatisfiabilityIssue[];
}

export interface ApiPolicyVersionItem {
  version: number;
  effective_from: string | null;
  created_by: string;
  created_by_name: string | null;
  source: Exclude<ConceptPolicySource, "system_default">;
  diff_summary: Array<{
    field: string;
    tier_index: number | null;
    step_no: number | null;
    from: unknown;
    to: unknown;
  }>;
}

export interface ApiPolicyVersionsResponse {
  data: ApiPolicyVersionItem[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface ApiSimulationResult {
  requires_approval: boolean;
  tier_index: number;
  steps: Array<{
    step_no: number;
    eligible: Array<{ user_id: string; full_name: string; role: string }>;
  }>;
  violations?: ApiSatisfiabilityIssue[];
}

export interface ApiCandidateUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  role: string;
}

function mapConditions(raw: ApiTierConditions | undefined): ApprovalTierConditions {
  const conditions: { categories?: string[]; missingCfdi?: true; manualAdjustments?: true } = {};
  if (raw?.categories && raw.categories.length > 0) conditions.categories = [...raw.categories];
  if (raw?.missing_cfdi === true) conditions.missingCfdi = true;
  if (raw?.manual_adjustments === true) conditions.manualAdjustments = true;
  return conditions;
}

function mapStep(raw: ApiRuleStep): ApprovalRuleStep {
  return {
    eligibleRoles: [...(raw.eligible_roles ?? [])] as UserRole[],
    eligibleUserIds: [...(raw.eligible_user_ids ?? [])],
  };
}

export function mapRules(raw: ApiRules): ApprovalRules {
  return {
    rulesSchemaVersion: APPROVAL_RULES_SCHEMA_VERSION,
    tiers: (raw.tiers ?? []).map(
      (tier): ApprovalTier => ({
        minAmount: Number(tier.min_amount ?? 0),
        conditions: mapConditions(tier.conditions),
        requiresApproval: tier.requires_approval !== false,
        steps: (tier.steps ?? []).map(mapStep),
      }),
    ),
  };
}

export function toApiRules(rules: ApprovalRules): ApiRules {
  return {
    rules_schema_version: APPROVAL_RULES_SCHEMA_VERSION,
    tiers: rules.tiers.map((tier) => {
      const conditions: ApiTierConditions = {};
      if (tier.conditions.categories && tier.conditions.categories.length > 0) {
        conditions.categories = [...tier.conditions.categories];
      }
      if (tier.conditions.missingCfdi === true) conditions.missing_cfdi = true;
      if (tier.conditions.manualAdjustments === true) conditions.manual_adjustments = true;
      return {
        min_amount: tier.minAmount,
        conditions,
        requires_approval: tier.requiresApproval,
        steps: tier.requiresApproval
          ? tier.steps.map((step) => ({
              eligible_roles: [...step.eligibleRoles],
              eligible_user_ids: [...step.eligibleUserIds],
            }))
          : [],
      };
    }),
  };
}

/** Unión de personas designadas en todos los pasos (lockstep D11 del API). */
export function collectEligibleUserIds(rules: ApprovalRules): string[] {
  const ids = new Set<string>();
  for (const tier of rules.tiers) {
    for (const step of tier.steps) for (const id of step.eligibleUserIds) ids.add(id);
  }
  return [...ids];
}

function mapIssues(raw: ApiSatisfiabilityIssue[] | undefined): SatisfiabilityIssue[] {
  return (raw ?? []).map((issue) => ({
    tierIndex: issue.tier_index,
    stepNo: issue.step_no,
    reason: issue.reason,
  }));
}

export function mapConceptPolicy(raw: ApiConceptPolicy): ConceptPolicy {
  return {
    concept: raw.concept,
    source: raw.source,
    version: raw.version ?? null,
    effectiveFrom: raw.effective_from ?? null,
    createdBy: raw.created_by ?? null,
    createdByName: raw.created_by_name ?? null,
    rules: mapRules(raw.rules),
    summary: raw.summary ?? "",
    pendingRequests: Number(raw.pending_requests ?? 0),
  };
}

export function mapApprovalPoliciesOverview(raw: ApiApprovalPoliciesOverview): ApprovalPoliciesOverview {
  return {
    editEnabled: raw.edit_enabled === true,
    concepts: (raw.concepts ?? []).map(mapConceptPolicy),
  };
}

export function mapSavedPolicyVersion(raw: ApiSavedPolicyVersion): SavedPolicyVersion {
  return {
    concept: raw.concept,
    source: raw.source === "system_default" ? "tenant" : raw.source,
    version: raw.version ?? 0,
    effectiveFrom: raw.effective_from ?? null,
    createdBy: raw.created_by ?? "",
    rules: mapRules(raw.rules),
    summary: raw.summary ?? "",
    warnings: mapIssues(raw.warnings),
  };
}

export function mapPolicyVersionsResponse(raw: ApiPolicyVersionsResponse): PolicyVersionPage {
  return {
    items: (raw.data ?? []).map((item) => ({
      version: item.version,
      effectiveFrom: item.effective_from ?? null,
      createdBy: item.created_by,
      createdByName: item.created_by_name ?? null,
      source: item.source,
      diffSummary: (item.diff_summary ?? []).map(
        (entry): PolicyDiffEntry => ({
          field: entry.field,
          tierIndex: entry.tier_index ?? null,
          stepNo: entry.step_no ?? null,
          from: entry.from,
          to: entry.to,
        }),
      ),
    })),
    page: raw.pagination?.page ?? 1,
    totalPages: raw.pagination?.total_pages ?? 1,
    total: raw.pagination?.total ?? 0,
  };
}

export function toApiSimulationFacts(facts: SimulationFacts): Record<string, unknown> {
  const body: Record<string, unknown> = { amount: facts.amount };
  if (facts.category) body.category = facts.category;
  if (facts.missingCfdi !== undefined) body.missing_cfdi = facts.missingCfdi;
  if (facts.manualAdjustments !== undefined) body.manual_adjustments = facts.manualAdjustments;
  return body;
}

export function mapSimulationResult(raw: ApiSimulationResult): SimulationResult {
  return {
    requiresApproval: raw.requires_approval === true,
    tierIndex: raw.tier_index,
    steps: (raw.steps ?? []).map((step) => ({
      stepNo: step.step_no,
      eligible: (step.eligible ?? []).map((user) => ({
        userId: user.user_id,
        fullName: user.full_name,
        role: user.role,
      })),
    })),
    violations: mapIssues(raw.violations),
  };
}

export function mapCandidateUser(raw: ApiCandidateUser): PolicyCandidateUser {
  const composed = [raw.first_name, raw.last_name].filter(Boolean).join(" ").trim();
  return {
    id: raw.id,
    fullName: raw.full_name?.trim() || composed || raw.email || raw.id,
    role: raw.role as UserRole,
  };
}
