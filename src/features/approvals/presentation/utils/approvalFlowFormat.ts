import { EXPENSE_CATEGORY_LABELS } from "@features/trips/domain";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  getApprovalGuardCode,
  isIntermediateStep,
  isSelfActionForbiddenCode,
  type ApprovableItem,
  type ApprovalActionUi,
  type ApprovalBlock,
  type ApprovalFieldChange,
  type ApprovalGuardCode,
  type ApprovalGuards,
  type ApprovalHistoryEntry,
  type ApprovalSignedStep,
  type BulkFailure,
} from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const flowCopy = approvalsCopy.flow;

export function formatApprovalRole(role: string | null | undefined): string | null {
  if (!role) return null;
  return ROLE_LABELS[role as UserRole] ?? role;
}

/** «Contador» · «Contador o Marta López» · «Contador +2» (handoff F6 D6). */
export function formatPendingFor(pendingFor: ApprovalBlock["pendingFor"]): string {
  const labels = [
    ...pendingFor.roles.map((role) => formatApprovalRole(role) ?? role),
    ...pendingFor.users
      .map((user) => user.fullName?.trim())
      .filter((name): name is string => Boolean(name)),
  ];
  const unique = Array.from(new Set(labels));
  if (unique.length === 0) return "";
  if (unique.length <= 2) return unique.join(flowCopy.pendingForJoin);
  return flowCopy.pendingForMore(unique[0], unique.length - 1);
}

/** «Falta comprobante: "…" · Ana López · 2 oct 2026» (handoff F6 D15). */
export function formatReturnedSummary(
  returned: ApprovalBlock["returned"] | null | undefined,
): string {
  if (!returned) return "";
  const reasonLabel = returned.reasonCode
    ? ((approvalsCopy.returnSheet.reasonCodes as Record<string, string>)[returned.reasonCode] ??
      null)
    : null;
  return flowCopy.returnedSummary({
    reasonLabel,
    reason: returned.reason?.trim() || null,
    by: returned.returnedByName?.trim() || null,
    date: returned.returnedAt ? formatDate(returned.returnedAt) : null,
  });
}

/** Quién firma el paso siguiente; `null` sin `next_step` (API previo) o sin nombres. */
export function formatNextStepLabel(
  approval: Pick<ApprovalBlock, "nextStep"> | null | undefined,
): string | null {
  const next = approval?.nextStep;
  if (!next) return null;
  return formatPendingFor(next) || null;
}

/**
 * Rol del paso siguiente común a las filas que avanzan (handoff F6 D10: «rol solo
 * si es común»); `null` si alguna no lo informa o difieren.
 */
export function commonNextStepLabel(
  items: ReadonlyArray<Pick<ApprovableItem, "approval">>,
): string | null {
  let label: string | null = null;
  for (const item of items) {
    if (!isIntermediateStep(item.approval)) continue;
    const current = formatNextStepLabel(item.approval);
    if (!current) return null;
    if (label !== null && label !== current) return null;
    label = current;
  }
  return label;
}

export function formatSignedLine(step: ApprovalSignedStep): string {
  return flowCopy.signedLine(
    step.fullName?.trim() || flowCopy.signedUnknown,
    formatApprovalRole(step.role),
    formatDate(step.decidedAt),
  );
}

/** «Entró por el tramo desde $X, sin CFDI de la regla v3. Requiere 2 firmas.» */
export function formatWhyTooltip(approval: ApprovalBlock): string {
  const condition = approval.routedBy.matchedConditions
    .map((key) => flowCopy.conditions[key])
    .filter(Boolean)
    .join(", ");
  return flowCopy.whyTooltip({
    minAmount:
      approval.routedBy.minAmount !== null
        ? formatMxCurrency(approval.routedBy.minAmount)
        : null,
    condition: condition || null,
    policyVersion: approval.routedBy.policyVersion,
    stepsTotal: approval.stepsTotal,
  });
}

const AMOUNT_FIELDS = new Set(["amount", "net_amount"]);
const CATEGORY_FIELDS = new Set(["category"]);
/** Identificadores u objetos: solo se dice que cambiaron. */
const OPAQUE_FIELDS = new Set(["trip_id", "employee_id", "items"]);

function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (AMOUNT_FIELDS.has(field)) {
    const amount = Number(value);
    return Number.isFinite(amount) ? formatMxCurrency(amount) : String(value);
  }
  if (CATEGORY_FIELDS.has(field) && typeof value === "string") {
    return (EXPENSE_CATEGORY_LABELS as Record<string, string>)[value] ?? value;
  }
  if (field === "period_start" || field === "period_end") {
    return formatDate(String(value));
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** Cambios legibles con etiquetas de un diccionario fijo; lo desconocido se omite. */
export function formatFieldChanges(changes: ReadonlyArray<ApprovalFieldChange>): string[] {
  return changes.flatMap((change) => {
    const label = flowCopy.fields[change.field];
    if (!label) return [];
    if (OPAQUE_FIELDS.has(change.field)) return [`${label}: ${flowCopy.fieldChanged}`];
    return [
      `${label}: ${formatChangeValue(change.field, change.from)} → ${formatChangeValue(change.field, change.to)}`,
    ];
  });
}

/**
 * Texto del estado que sustituye a las acciones (ítem deshabilitado en menús ⋯).
 * `null` cuando hay acción o no hay nada que decir.
 */
export function approvalActionStateLabel(actionUi: ApprovalActionUi): string | null {
  switch (actionUi.kind) {
    case "own_blocked":
      return approvalsCopy.selfApproval.ownChip;
    case "already_signed":
      return flowCopy.alreadySignedChip(actionUi.stepNo);
    case "waiting":
      return flowCopy.waitingChip(formatPendingFor(actionUi.pendingFor));
    case "no_active_eligible":
      return flowCopy.noActiveChip;
    default:
      return null;
  }
}

/** Guardas que se envían con cada decisión (handoff F6 §6). */
export function approvalGuardsFor(
  item: Pick<ApprovableItem, "approval" | "approvalRevision">,
): ApprovalGuards {
  const guards: ApprovalGuards = {};
  const step = item.approval?.stepCurrent;
  if (typeof step === "number") guards.expectedStep = step;
  if (item.approvalRevision) guards.expectedRevision = item.approvalRevision;
  return guards;
}

export function formatHistoryEventLabel(entry: ApprovalHistoryEntry): string {
  const historyCopy = approvalsCopy.history;
  if (entry.eventType === "invalidated") {
    return (
      (entry.reasonCode && historyCopy.invalidated[entry.reasonCode]) ||
      historyCopy.invalidatedDefault
    );
  }
  const label = historyCopy.events[entry.eventType];
  return label ? label(entry.stepNo) : historyCopy.unknownEvent;
}

export function guardErrorMessage(code: ApprovalGuardCode): string {
  return approvalsCopy.guardErrors[code];
}

/** Mensaje por código para un fallo de masiva; sin código conocido usa el del API. */
export function describeBulkFailureMessage(failure: BulkFailure): string {
  const guard = getApprovalGuardCode(failure.error);
  if (guard) return guardErrorMessage(guard);
  if (isSelfActionForbiddenCode(failure.error.code)) {
    return failure.error.message || approvalsCopy.selfApproval.serverRejected;
  }
  return failure.error.message;
}

/** Folio legible de la solicitud para listas de resultados. */
export function approvableFolio(item: ApprovableItem | undefined): string {
  const fallback = approvalsCopy.bulkFlow.unknownFolio;
  if (!item) return fallback;
  const context = item.context;
  const amount = formatMxCurrency(item.amount);
  switch (context.approvableType) {
    case "trip_expense":
      return [context.tripCode, context.description?.trim(), amount]
        .filter(Boolean)
        .join(" · ");
    case "driver_advance_request":
      return [context.folio, context.employeeFullName, amount].filter(Boolean).join(" · ");
    case "internal_staff_compensation":
      return [context.settlementNumber, context.employeeFullName, amount]
        .filter(Boolean)
        .join(" · ");
    default:
      return fallback;
  }
}
