/**
 * Orden de secciones del índice = menú lateral + Tu cuenta al final.
 * Grupos no listados se listan después, orden alfabético por clave.
 * Alineado a `navigationConfig` (operations → monitoring → … → admin) + portales + tu_cuenta.
 */
export const HELP_INDEX_GROUP_ORDER: readonly string[] = [
  "operacion",
  "monitoreo",
  "flota",
  "comercial",
  "facturacion",
  "cobranza",
  "pagos_operadores",
  "finanzas",
  "administracion",
  "configuracion",
  "portales",
  "tu_cuenta",
];

export function sortHelpGroupKeys(keys: string[]): string[] {
  const orderIndex = new Map(
    HELP_INDEX_GROUP_ORDER.map((key, index) => [key, index]),
  );
  return [...keys].sort((a, b) => {
    const ai = orderIndex.get(a);
    const bi = orderIndex.get(b);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.localeCompare(b);
  });
}
