/**
 * Resolución unívoca de códigos SAT de catálogo (colonia/localidad).
 * Evita colisiones cuando varios ítems comparten el mismo segmento corto
 * (p. ej. `{CP}-{colonia}` de distintos CP del mismo municipio).
 */

export type SatCatalogCodeOption = {
  code: string;
  name?: string;
};

export function toShortSatCode(value: string): string {
  if (!value.includes("-")) return value;
  const parts = value.split("-").filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

/**
 * Resuelve un valor de form (corto o compuesto) a un código de catálogo.
 * - Match exacto (case-insensitive) → ese código.
 * - Match por short: solo si hay exactamente un candidato; si hay varios y
 *   `postalCode` es un CP de 5 dígitos, preferir `code.startsWith("{cp}-")`
 *   y solo si queda uno.
 * - Ambiguo → devolver el valor normalizado sin expandir al primero.
 */
export function resolveCatalogCode(
  rawValue: string,
  options: readonly SatCatalogCodeOption[],
  postalCode?: string | null,
): string {
  const normalized = rawValue.trim();
  if (!normalized) return "";

  const exact = options.find(
    (option) => option.code.toUpperCase() === normalized.toUpperCase(),
  );
  if (exact) return exact.code;

  const shortCode = toShortSatCode(normalized);
  const shortMatches = options.filter(
    (option) => toShortSatCode(option.code) === shortCode,
  );

  if (shortMatches.length === 1) {
    return shortMatches[0]?.code ?? normalized;
  }

  if (shortMatches.length > 1) {
    const cp = postalCode?.trim() ?? "";
    if (/^\d{5}$/.test(cp)) {
      const prefix = `${cp}-`;
      const byPostal = shortMatches.filter((option) =>
        option.code.startsWith(prefix),
      );
      if (byPostal.length === 1) {
        return byPostal[0]?.code ?? normalized;
      }
    }
  }

  return normalized;
}

/**
 * Si hay opciones con forma `{CP}-…` para el CP actual, limita a esas.
 * Si ninguna coincide (catálogo municipio-shape sin prefijo CP), deja la lista.
 */
export function filterOptionsByPostalCodePrefix<T extends SatCatalogCodeOption>(
  options: readonly T[],
  postalCode: string | null | undefined,
): T[] {
  const cp = postalCode?.trim() ?? "";
  if (!/^\d{5}$/.test(cp)) return [...options];

  const prefix = `${cp}-`;
  const prefixed = options.filter((option) => option.code.startsWith(prefix));
  return prefixed.length > 0 ? prefixed : [...options];
}
