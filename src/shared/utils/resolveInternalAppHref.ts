/**
 * Resuelve un href interno de la SPA a partir de `location.state.from`.
 * Rechaza URLs externas, protocol-relative y esquemas no permitidos.
 */
export function resolveInternalAppHref(
  from: string | undefined,
  fallback: string,
): string {
  if (from == null || from.trim() === "") return fallback;

  const trimmed = from.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  const schemeIndex = trimmed.indexOf(":");
  if (schemeIndex > 0 && schemeIndex < trimmed.indexOf("/")) {
    return fallback;
  }

  return trimmed;
}
