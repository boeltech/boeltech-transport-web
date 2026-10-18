/**
 * Estados que el API cuenta en el KPI / tab «Excepciones REP».
 * Paridad con `FinanceRepExceptionStatus` — no ampliar ni restringir aquí.
 */
const REP_EXCEPTION_STATUSES = new Set<string>([
  "pending",
  "failed",
  "restamp_pending",
  "cancelling",
]);

/** True si `status` es uno de los estados excepción del API (incl. pending). */
export function isRepExceptionStatus(status: string): boolean {
  return REP_EXCEPTION_STATUSES.has(status);
}

/**
 * True cuando el poll observa una transición live **fuera** de excepción
 * (p. ej. pending → stamped). Sin prev (primer tick) o mismo status → false.
 */
export function leftRepExceptionStatus(
  previousStatus: string | undefined,
  nextStatus: string,
): boolean {
  if (previousStatus === undefined) return false;
  if (previousStatus === nextStatus) return false;
  return (
    isRepExceptionStatus(previousStatus) && !isRepExceptionStatus(nextStatus)
  );
}
