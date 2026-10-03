/**
 * Reconocimiento de errores del contrato de reglas de autorización (SDD §3.9).
 * Acepta `ApiError` normalizado y `AxiosError` crudo (403 no se normaliza).
 */
import type { PolicyOrphanViolation, SatisfiabilityIssue } from "./entities";

export const POLICY_ERROR_CODES = {
  VALIDATION: "VALIDATION_ERROR",
  UNSATISFIABLE: "APPROVAL_POLICY_UNSATISFIABLE",
  VERSION_CONFLICT: "APPROVAL_POLICY_VERSION_CONFLICT",
  EDIT_DISABLED: "APPROVAL_POLICIES_EDIT_DISABLED",
  ORPHAN_GUARD: "APPROVAL_POLICY_ORPHAN_GUARD",
  MANAGED: "APPROVAL_POLICY_MANAGED",
} as const;

interface ErrorFacts {
  readonly status: number | null;
  readonly code: string | null;
  readonly message: string | null;
  readonly details: Record<string, unknown> | null;
  /** Issues Zod de forma (`details` array o `details.issues`). */
  readonly issues: Array<{ path: Array<string | number>; message: string }>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toIssues(raw: unknown): ErrorFacts["issues"] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const issue = asRecord(entry);
    if (!issue || !Array.isArray(issue.path)) return [];
    return [{ path: issue.path as Array<string | number>, message: nonEmpty(issue.message) ?? "" }];
  });
}

export function readErrorFacts(error: unknown): ErrorFacts {
  const record = asRecord(error);
  if (!record) return { status: null, code: null, message: null, details: null, issues: [] };
  const response = asRecord(record.response);
  const data = asRecord(response?.data);
  const rawDetails = data ? data.details : record.details;
  const details = asRecord(rawDetails);
  const status =
    typeof record.status === "number"
      ? record.status
      : typeof response?.status === "number"
        ? response.status
        : null;
  return {
    status,
    code: nonEmpty(data?.code) ?? nonEmpty(record.code),
    message: nonEmpty(data?.error) ?? nonEmpty(record.message),
    details,
    issues: Array.isArray(rawDetails) ? toIssues(rawDetails) : toIssues(details?.issues),
  };
}

function toViolations(raw: unknown): SatisfiabilityIssue[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const item = asRecord(entry);
    if (!item) return [];
    return [
      {
        tierIndex: typeof item.tier_index === "number" ? item.tier_index : -1,
        stepNo: typeof item.step_no === "number" ? item.step_no : 0,
        reason: nonEmpty(item.reason) ?? "unknown",
      },
    ];
  });
}

export type SavePolicyErrorKind =
  | "unsatisfiable"
  | "validation"
  | "conflict"
  | "edit_disabled"
  | "other";

export interface SavePolicyError {
  readonly kind: SavePolicyErrorKind;
  readonly message: string | null;
  readonly violations: SatisfiabilityIssue[];
  readonly issues: ErrorFacts["issues"];
  readonly currentVersion: number | null;
}

export function classifySavePolicyError(error: unknown): SavePolicyError {
  const facts = readErrorFacts(error);
  const violations = toViolations(facts.details?.violations);
  const base = { message: facts.message, violations, issues: facts.issues, currentVersion: null };
  switch (facts.code) {
    case POLICY_ERROR_CODES.UNSATISFIABLE:
      return { ...base, kind: "unsatisfiable" };
    case POLICY_ERROR_CODES.VERSION_CONFLICT: {
      const current = facts.details?.current_version;
      return { ...base, kind: "conflict", currentVersion: typeof current === "number" ? current : null };
    }
    case POLICY_ERROR_CODES.EDIT_DISABLED:
      return { ...base, kind: "edit_disabled" };
    case POLICY_ERROR_CODES.VALIDATION:
      return { ...base, kind: "validation" };
    default:
      return { ...base, kind: "other" };
  }
}

/** 409 `APPROVAL_POLICY_ORPHAN_GUARD` al desactivar o cambiar rol de un usuario. */
export function getPolicyOrphanGuardError(
  error: unknown,
): { message: string | null; violations: PolicyOrphanViolation[] } | null {
  const facts = readErrorFacts(error);
  if (facts.code !== POLICY_ERROR_CODES.ORPHAN_GUARD) return null;
  const raw = facts.details?.violations;
  const violations = Array.isArray(raw)
    ? raw.flatMap((entry) => {
        const item = asRecord(entry);
        if (!item) return [];
        return [
          {
            concept: nonEmpty(item.concept) ?? "",
            policyVersion: typeof item.policy_version === "number" ? item.policy_version : null,
            tierIndex: typeof item.tier_index === "number" ? item.tier_index : 0,
            stepNo: typeof item.step_no === "number" ? item.step_no : 1,
            reason: nonEmpty(item.reason) ?? "no_eligible",
          },
        ];
      })
    : [];
  return { message: facts.message, violations };
}
