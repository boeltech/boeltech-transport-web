import {
  isApprovableActionable,
  type ApprovableItem,
  type ApprovalBlock,
  type ApprovalDecisionOutcome,
  type ApprovalQueue,
  type ApprovalReturnReasonCode,
  type ApprovableType,
  type BulkSuccess,
  type ListApprovalsFilters,
} from "./entities";
import {
  APPROVABLE_SELF_APPROVAL_CONCEPT,
  isOwnRecord,
  resolveSelfActionUi,
  type SelfApprovalCapability,
  type SelfApprovalPolicy,
} from "./selfApproval";

/**
 * ADR-0099 (handoff F6 D1): qué puede hacer quien mira una solicitud. Una sola
 * función para bandeja, Costos, anticipos y liquidación (UX6).
 */
export type ApprovalActionUi =
  | { kind: "returned" }
  | { kind: "own_blocked" }
  | { kind: "act"; selfConfirm: boolean }
  | { kind: "already_signed"; stepNo: number }
  | { kind: "waiting"; pendingFor: ApprovalBlock["pendingFor"] }
  | { kind: "no_active_eligible" }
  | { kind: "read_only" }
  | { kind: "closed" };

export interface ResolveApprovalActionContext {
  /** El usuario creó o envió el registro. */
  isOwn: boolean;
  /** Capacidad ADR-0098 del concepto; sin cargar = bloqueo visual (fail-closed). */
  selfPolicy: Pick<SelfApprovalCapability, "allowed"> | null | undefined;
  /** Permiso web para decidir (lockstep con el techo del API). */
  canDecide: boolean;
  /** Estado del registro todavía decidible; solo se usa con `approval` ausente. */
  isPending: boolean;
  /** Para «Ya firmaste el paso {n}». */
  userId?: string | null;
}

const OPEN_FLOW_STATUSES: ReadonlyArray<ApprovalBlock["flowStatus"]> = [
  "not_started",
  "in_progress",
];

function signedStepOf(
  approval: ApprovalBlock,
  userId: string | null | undefined,
): number {
  const own = userId
    ? approval.signedSteps.find((step) => step.userId === userId)
    : undefined;
  if (own) return own.stepNo;
  return Math.max(1, (approval.stepCurrent ?? approval.stepsTotal) - 1);
}

/**
 * Precedencia (gana el primero): Devuelta > Enviada por ti > acciones (con o
 * sin confirmación de autoaprobación) > Ya firmaste > Espera a > Sin
 * autorizador activo > solo lectura > cerrado. Sin bloque `approval` se
 * conserva el comportamiento previo al motor.
 */
export function resolveApprovalActionUi(
  approval: ApprovalBlock | null | undefined,
  ctx: ResolveApprovalActionContext,
): ApprovalActionUi {
  const selfUi = resolveSelfActionUi({ isOwn: ctx.isOwn, policy: ctx.selfPolicy });

  if (!approval) {
    if (!ctx.isPending) return { kind: "closed" };
    if (selfUi === "blocked_own") return { kind: "own_blocked" };
    if (!ctx.canDecide) return { kind: "read_only" };
    return { kind: "act", selfConfirm: selfUi === "self_confirm" };
  }

  if (approval.flowStatus === "returned") return { kind: "returned" };

  const open = OPEN_FLOW_STATUSES.includes(approval.flowStatus);
  if (!open) return { kind: "closed" };

  if (approval.cannotActReason === "self_action" || selfUi === "blocked_own") {
    return { kind: "own_blocked" };
  }

  if (approval.canAct) {
    if (!ctx.canDecide) return { kind: "read_only" };
    return { kind: "act", selfConfirm: selfUi === "self_confirm" };
  }

  switch (approval.cannotActReason) {
    case "already_signed":
      return { kind: "already_signed", stepNo: signedStepOf(approval, ctx.userId) };
    case "not_eligible":
      return { kind: "waiting", pendingFor: approval.pendingFor };
    case "no_active_eligible":
      return { kind: "no_active_eligible" };
    case "no_permission":
      return { kind: "read_only" };
    default:
      return { kind: "closed" };
  }
}

/** Atajo para ítems de la bandeja: propio = `submitted_by`, política por concepto. */
export function resolveApprovableActionUi(
  item: Pick<ApprovableItem, "approvableType" | "submittedBy" | "status" | "approval">,
  userId: string | null | undefined,
  policy: SelfApprovalPolicy | null | undefined,
  canDecide: boolean,
): ApprovalActionUi {
  const concept = APPROVABLE_SELF_APPROVAL_CONCEPT[item.approvableType];
  return resolveApprovalActionUi(item.approval, {
    isOwn: isOwnRecord(userId, [item.submittedBy]),
    selfPolicy: concept ? policy?.[concept] : undefined,
    canDecide,
    isPending: isApprovableActionable(item),
    userId,
  });
}

/** Dos o más pasos: muestra «Paso x de y», quién firmó y «¿Por qué te toca?». */
export function isMultiStepApproval(
  approval: ApprovalBlock | null | undefined,
): approval is ApprovalBlock {
  return Boolean(approval && approval.stepsTotal > 1);
}

/**
 * UX5: un tenant sin política propia no ve chips ni líneas nuevas en
 * solicitudes de un paso. Escalado, línea de paso y «¿Por qué te toca?» solo
 * aparecen con regla propia o con varios pasos.
 */
export function showsApprovalPolicySignals(
  approval: ApprovalBlock | null | undefined,
): approval is ApprovalBlock {
  return Boolean(
    approval && (approval.stepsTotal > 1 || approval.routedBy.policyVersion !== null),
  );
}

/**
 * Chip «Reautorización» (UX5 enmendada, excepción UX8): con regla propia o
 * varios pasos, ante cualquier corrección; con la regla estándar, solo si la
 * corrección anuló una autorización vigente.
 */
export function showsReapprovalSignal(
  approval: ApprovalBlock | null | undefined,
): approval is ApprovalBlock & { reapproval: NonNullable<ApprovalBlock["reapproval"]> } {
  const reapproval = approval?.reapproval;
  if (!approval || !reapproval) return false;
  if (!OPEN_FLOW_STATUSES.includes(approval.flowStatus)) return false;
  return showsApprovalPolicySignals(approval) || reapproval.previousStatus === "approved";
}

/** Firma un paso intermedio: queda otro por firmar después. */
export function isIntermediateStep(
  approval: ApprovalBlock | null | undefined,
): approval is ApprovalBlock & { stepCurrent: number } {
  return Boolean(
    approval &&
      approval.stepCurrent !== null &&
      approval.stepCurrent < approval.stepsTotal,
  );
}

export interface BulkApprovePrediction {
  total: number;
  /** Quedan autorizadas con esta firma. */
  willApprove: number;
  /** Pasan al siguiente paso. */
  willAdvance: number;
  /** Paso al que avanzan (`null` si ninguna avanza). */
  nextStep: number | null;
}

/** Handoff F6 D10: lo que pasará al aprobar en masa, según el paso de cada fila. */
export function predictBulkApprove(
  items: ReadonlyArray<Pick<ApprovableItem, "approval">>,
): BulkApprovePrediction {
  let willAdvance = 0;
  let nextStep: number | null = null;
  for (const item of items) {
    if (isIntermediateStep(item.approval)) {
      willAdvance += 1;
      const candidate = item.approval.stepCurrent + 1;
      nextStep = nextStep === null ? candidate : Math.min(nextStep, candidate);
    }
  }
  return {
    total: items.length,
    willApprove: items.length - willAdvance,
    willAdvance,
    nextStep,
  };
}

export type BulkOutcomeCounts = Record<ApprovalDecisionOutcome, number>;

/** Conteo por `outcome`; sin `outcome` (API previo) cuenta según la acción. */
export function countBulkOutcomes(
  successes: ReadonlyArray<Pick<BulkSuccess, "outcome">>,
  fallback: ApprovalDecisionOutcome,
): BulkOutcomeCounts {
  const counts: BulkOutcomeCounts = {
    approved: 0,
    rejected: 0,
    step_signed: 0,
    returned: 0,
  };
  for (const success of successes) {
    counts[success.outcome ?? fallback] += 1;
  }
  return counts;
}

/** Errores de guarda del motor (handoff F6 §6): avisar y recargar, nunca reintentar. */
export const APPROVAL_GUARD_CODES = [
  "APPROVAL_STEP_CHANGED",
  "APPROVAL_REVISION_CHANGED",
  "APPROVAL_REQUEST_RETURNED",
  "APPROVAL_STEP_NOT_ELIGIBLE",
  "APPROVAL_STEP_ALREADY_SIGNED",
  "APPROVAL_MATERIAL_EDIT_LOCKED",
] as const;

export type ApprovalGuardCode = (typeof APPROVAL_GUARD_CODES)[number];

export function isApprovalGuardCode(code: unknown): code is ApprovalGuardCode {
  return (
    typeof code === "string" &&
    (APPROVAL_GUARD_CODES as readonly string[]).includes(code)
  );
}

/** Reconoce la guarda en `ApiError` normalizado o en un fallo de masiva. */
export function getApprovalGuardCode(error: unknown): ApprovalGuardCode | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return isApprovalGuardCode(code) ? code : null;
}

/** «Me toca» = lo que el usuario puede firmar; «Todas» suma los devueltos (handoff F6 D7). */
export function queueListFilters(
  queue: ApprovalQueue,
): Pick<ListApprovalsFilters, "assignedToMe" | "includeReturned"> {
  return queue === "mine" ? { assignedToMe: true } : { includeReturned: true };
}

/** Motivos rápidos de «Devolver para corregir» por tipo (handoff F6 D9). */
export const RETURN_REASON_CODES_BY_TYPE: Partial<
  Record<ApprovableType, readonly ApprovalReturnReasonCode[]>
> = {
  trip_expense: ["missing_receipt", "wrong_amount", "other"],
  driver_advance_request: ["wrong_amount", "wrong_operator", "other"],
  internal_staff_compensation: ["wrong_amount", "missing_receipt", "other"],
};

export function returnReasonCodesFor(
  type: ApprovableType,
): readonly ApprovalReturnReasonCode[] {
  return RETURN_REASON_CODES_BY_TYPE[type] ?? ["other"];
}
