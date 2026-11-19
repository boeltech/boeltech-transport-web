/**
 * Une piezas de identidad del encabezado de detalle en una sola línea (NL / VIS P2).
 * Omite vacíos; separador canónico « · ».
 */
export function formatDetailContext(
  parts: ReadonlyArray<string | null | undefined>,
): string {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length > 0)
    .join(" · ");
}
