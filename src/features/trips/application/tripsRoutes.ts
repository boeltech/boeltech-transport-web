/** Rutas UI del módulo Viajes. */

export const TRIPS_LIST_PATH = "/trips";

/** Query del workbench «Atención fiscal» (`?fiscalAttention=1`). */
export const TRIPS_FISCAL_ATTENTION_PARAM = "fiscalAttention";

/** Deep link a la cola Atención fiscal en el listado de viajes. */
export function buildTripsFiscalAttentionHref(): string {
  return `${TRIPS_LIST_PATH}?${TRIPS_FISCAL_ATTENTION_PARAM}=1`;
}
