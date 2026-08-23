const MAX_REP_LAST_ERROR_LEN = 500;

const REP_LAST_ERROR_GENERIC =
  "No se pudo timbrar el complemento de pago (REP). Reintente más tarde o contacte a soporte.";

/** Heuristic: SOAP / ProFact dumps must never reach the UI verbatim. */
function looksLikePacDump(message: string): boolean {
  return /ProFact|TimbraCFDI|SOAP|<\?xml|Error de validación XSD|CFDI40\d{3}/i.test(
    message,
  );
}

/**
 * Defense-in-depth scrub for `rep_last_error` on the client mapper.
 * API already sanitizes on write; this covers legacy rows.
 */
export function sanitizeRepLastErrorForDisplay(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (looksLikePacDump(trimmed)) return REP_LAST_ERROR_GENERIC;
  if (trimmed.length <= MAX_REP_LAST_ERROR_LEN) return trimmed;
  return `${trimmed.slice(0, MAX_REP_LAST_ERROR_LEN - 1)}…`;
}
