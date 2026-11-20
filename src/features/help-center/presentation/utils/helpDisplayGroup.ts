/**
 * Remapeo display P-V1 A (hasta que TEC/barrido escriba `group` en BD).
 * Claves = ids de artículo o group legacy → group de menú / Tu cuenta.
 */

/** Artículo → group display (5 ids del handoff V5). */
export const HELP_ARTICLE_GROUP_REMAP: Readonly<Record<string, string>> = {
  "liquidar-viaje": "pagos_operadores",
  "registrar-anticipo-operador": "pagos_operadores",
  "esquema-compensacion": "pagos_operadores",
  "comparar-sucursales": "administracion",
  "cuenta-seguridad": "tu_cuenta",
};

/** Group legacy de API → group display (menú). */
export const HELP_LEGACY_GROUP_REMAP: Readonly<Record<string, string>> = {
  viajes: "operacion",
};

/**
 * Orden de secciones del índice = menú lateral + Tu cuenta al final.
 * Grupos no listados se listan después, orden alfabético por clave.
 */
export const HELP_INDEX_GROUP_ORDER: readonly string[] = [
  "operacion",
  "flota",
  "comercial",
  "facturacion",
  "cobranza",
  "pagos_operadores",
  "finanzas",
  "administracion",
  "configuracion",
  "tu_cuenta",
];

export function resolveHelpDisplayGroup(
  articleId: string,
  apiGroup: string,
): string {
  if (HELP_ARTICLE_GROUP_REMAP[articleId]) {
    return HELP_ARTICLE_GROUP_REMAP[articleId];
  }
  if (HELP_LEGACY_GROUP_REMAP[apiGroup]) {
    return HELP_LEGACY_GROUP_REMAP[apiGroup];
  }
  return apiGroup;
}

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
