import type { ApprovableItem, ApprovableType, BulkFailure } from "./entities";

/**
 * ADR-0098: capacidades de autoacción calculadas por el API con el rol vigente
 * del usuario. El web solo las refleja; nunca habilita algo que el API rechace.
 */
export type SelfApprovalConcept =
  | "advanceApprove"
  | "advanceDisburse"
  | "settlementApprove"
  | "settlementDisburse"
  | "tripExpenseApprove";

export interface SelfApprovalCapability {
  readonly allowed: boolean;
  readonly activeCounterpartCount: number;
}

export type SelfApprovalPolicy = Readonly<
  Record<SelfApprovalConcept, SelfApprovalCapability>
>;

export type SelfActionUi = "normal" | "self_confirm" | "blocked_own";

export function isOwnRecord(
  userId: string | null | undefined,
  makerIds: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!userId) return false;
  return makerIds.some((makerId) => Boolean(makerId) && makerId === userId);
}

/**
 * Única fuente de decisión de UI para autoacción. Sin política cargada y con
 * registro propio se bloquea (fail-closed visual).
 */
export function resolveSelfActionUi(input: {
  isOwn: boolean;
  policy: Pick<SelfApprovalCapability, "allowed"> | null | undefined;
}): SelfActionUi {
  if (!input.isOwn) return "normal";
  return input.policy?.allowed === true ? "self_confirm" : "blocked_own";
}

export const APPROVABLE_SELF_APPROVAL_CONCEPT: Partial<
  Record<ApprovableType, SelfApprovalConcept>
> = {
  trip_expense: "tripExpenseApprove",
  driver_advance_request: "advanceApprove",
  internal_staff_compensation: "settlementApprove",
};

export function resolveApprovableSelfActionUi(
  item: Pick<ApprovableItem, "approvableType" | "submittedBy">,
  userId: string | null | undefined,
  policy: SelfApprovalPolicy | null | undefined,
): SelfActionUi {
  const concept = APPROVABLE_SELF_APPROVAL_CONCEPT[item.approvableType];
  return resolveSelfActionUi({
    isOwn: isOwnRecord(userId, [item.submittedBy]),
    policy: concept ? policy?.[concept] : undefined,
  });
}

export type SelfApprovedRecordKind =
  | "approvable"
  | "advance"
  | "settlement"
  | "tripExpense";

/** Estados aprobados o posteriores a la aprobación, por tipo de registro. */
export const SELF_APPROVED_BADGE_STATUSES: Readonly<
  Record<SelfApprovedRecordKind, readonly string[]>
> = {
  approvable: ["approved"],
  advance: [
    "pending_disbursement",
    "disbursed",
    "partially_applied",
    "fully_applied",
  ],
  settlement: ["approved", "disbursed"],
  tripExpense: ["approved"],
};

/**
 * El API marca `self_segregated_approval` también cuando quien envió rechaza
 * lo propio; el badge «Autoaprobado» solo aplica a registros autorizados.
 */
export function showsSelfApprovedBadge(input: {
  kind: SelfApprovedRecordKind;
  status: string | null | undefined;
  selfSegregatedApproval: boolean | null | undefined;
}): boolean {
  if (input.selfSegregatedApproval !== true || !input.status) return false;
  return SELF_APPROVED_BADGE_STATUSES[input.kind].includes(input.status);
}

export const SELF_ACTION_FORBIDDEN_CODES = [
  "SELF_APPROVAL_FORBIDDEN",
  "MAKER_EXECUTE_FORBIDDEN",
  "SUBMITTER_EXECUTE_FORBIDDEN",
  "SETTLEMENT_MAKER_UNKNOWN",
] as const;

export type SelfActionForbiddenCode =
  (typeof SELF_ACTION_FORBIDDEN_CODES)[number];

export type SelfActionForbiddenReason =
  | "not_exempt_role"
  | "counterpart_available"
  | "strict_maker_unknown";

export interface SelfActionForbiddenError {
  readonly code: SelfActionForbiddenCode;
  readonly message: string | null;
  readonly reason: SelfActionForbiddenReason | string | null;
}

export function isSelfActionForbiddenCode(
  code: unknown,
): code is SelfActionForbiddenCode {
  return (
    typeof code === "string" &&
    (SELF_ACTION_FORBIDDEN_CODES as readonly string[]).includes(code)
  );
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Reconoce el 403 de autoacción en errores ya normalizados (`ApiError`,
 * `ExpenseError` de viajes o fallos de bulk).
 */
export function getSelfActionForbiddenError(
  error: unknown,
): SelfActionForbiddenError | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    originalMessage?: unknown;
    details?: unknown;
  };
  if (!isSelfActionForbiddenCode(candidate.code)) return null;
  const details =
    candidate.details && typeof candidate.details === "object"
      ? (candidate.details as { reason?: unknown })
      : null;
  return {
    code: candidate.code,
    message:
      nonEmptyString(candidate.originalMessage) ??
      nonEmptyString(candidate.message),
    reason: nonEmptyString(details?.reason),
  };
}

export function hasSelfActionForbiddenFailure(
  failures:
    | ReadonlyArray<{ error?: Pick<BulkFailure["error"], "code"> | null }>
    | null
    | undefined,
): boolean {
  return (failures ?? []).some((failure) =>
    isSelfActionForbiddenCode(failure.error?.code),
  );
}
