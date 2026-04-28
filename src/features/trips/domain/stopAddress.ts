/**
 * Reglas mínimas para direcciones unificadas (`addresses`) en paradas de viaje.
 * Capa domain — sin dependencias de UI.
 */

const UNIFIED_ADDRESS_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** `true` si el valor parece UUID v4 de fila `addresses` (reutilización de domicilio). */
export function isUnifiedAddressId(value?: string | null): boolean {
  const v = value?.trim();
  if (!v) return false;
  return UNIFIED_ADDRESS_ID_REGEX.test(v);
}
