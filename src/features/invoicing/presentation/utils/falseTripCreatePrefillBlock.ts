/**
 * Prefill 409 codes that must block create UI for scope=false_trip
 * even when trip context failed to load (ADR-0079 audit H2).
 */
const FALSE_TRIP_PREFILL_BLOCK_CODES = new Set([
  "FALSE_TRIP_OUTCOME_REQUIRED",
  "FALSE_TRIP_NOT_COMPLETED",
  "FALSE_TRIP_HAS_ACTIVE_CARGO",
  "TRIP_ALREADY_INVOICED",
  "SPLIT_INCOMPATIBLE_WITH_FALSE_TRIP",
]);

const FALSE_TRIP_PREFILL_BLOCK_MESSAGE_RE =
  /false_trip_outcome_required|false_trip_not_completed|false_trip_has_active_cargo|trip_already_invoiced|split_incompatible_with_false_trip|desenlace\s+falso|principal\s+activa|factura\s+activa\s+vinculad[oa]|prorrateo\s+activo|debe\s+estar\s+completado/i;

export function isFalseTripPrefillBlockedError(
  code: string | undefined,
  message: string | undefined,
): boolean {
  if (code && FALSE_TRIP_PREFILL_BLOCK_CODES.has(code)) {
    return true;
  }
  if (message && FALSE_TRIP_PREFILL_BLOCK_MESSAGE_RE.test(message)) {
    return true;
  }
  return false;
}
