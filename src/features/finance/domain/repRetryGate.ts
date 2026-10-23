/**
 * PAC timeout → revisión manual (paridad API
 * `REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE`). No inventar heurísticas F2.
 */
export const REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE =
  "El PAC no confirmó el timbrado a tiempo. Revise en el PAC antes de reintentar; no reintente a ciegas.";

/**
 * Prefijo client-safe de PAC config (paridad API `PAC_STAMP_CONFIG_MESSAGE`).
 * El API puede añadir el hint 702 («Registre el RFC emisor…»).
 */
export const REP_PAC_CONFIG_ERROR_MESSAGE =
  "No se pudo timbrar: la cuenta o el RFC emisor no están listos en el proveedor de timbrado.";

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

/**
 * Mensaje client-safe de config PAC (cuenta / RFC emisor no listo).
 * Match estable del texto API + tip. 702.
 */
export function isRepPacConfigErrorMessage(
  repLastError?: string | null,
): boolean {
  if (!repLastError) return false;
  if (repLastError.includes(REP_PAC_CONFIG_ERROR_MESSAGE)) return true;
  if (repLastError.includes("Registre el RFC emisor")) return true;
  if (
    repLastError.includes("RFC emisor") &&
    repLastError.includes("no están listos en el proveedor")
  ) {
    return true;
  }
  return false;
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
 * (no manual_review, no permanent, no config, no orphan).
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
  if (isRepPacConfigErrorMessage(input.repLastError)) return false;
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
