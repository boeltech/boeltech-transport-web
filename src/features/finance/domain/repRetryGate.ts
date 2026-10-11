/**
 * PAC timeout → revisión manual (paridad API
 * `REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE`). No inventar heurísticas F2.
 */
export const REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE =
  "El PAC no confirmó el timbrado a tiempo. Revise en el PAC antes de reintentar; no reintente a ciegas.";

export function isRepManualReview(input: {
  readonly waitReason?: string | null;
  readonly repLastError?: string | null;
  readonly repErrorKind?: string | null;
}): boolean {
  if (input.repErrorKind === "manual_review") return true;
  if (input.waitReason === "manual_review") return true;
  return input.repLastError === REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE;
}

/** Fallo permanente del PAC (validación) — no reintentar a ciegas. */
export function isRepPermanentError(input: {
  readonly repErrorKind?: string | null;
}): boolean {
  return input.repErrorKind === "permanent";
}

/** Orphan: UUID presente con failed — no reintentar a ciegas. */
export function isRepOrphanParked(input: {
  readonly repStatus: string;
  readonly repCfdiUuid?: string | null;
}): boolean {
  return input.repStatus === "failed" && Boolean(input.repCfdiUuid);
}

/**
 * CTA Reintentar timbrado: solo failed reintentable
 * (no manual_review, no permanent, no orphan).
 */
export function canRetryRepStamp(input: {
  readonly repStatus: string;
  readonly waitReason?: string | null;
  readonly repLastError?: string | null;
  readonly repCfdiUuid?: string | null;
  readonly repErrorKind?: string | null;
}): boolean {
  if (input.repStatus !== "failed") return false;
  if (isRepOrphanParked(input)) return false;
  if (isRepManualReview(input)) return false;
  if (isRepPermanentError(input)) return false;
  return true;
}

export function isRepStatusTerminal(status: string): boolean {
  return (
    status === "stamped" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "not_required"
  );
}
