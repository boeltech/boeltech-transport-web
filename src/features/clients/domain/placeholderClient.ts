/**
 * Cliente interno v1 (migración API 070) — dueño comercial placeholder en `trip_cargos`.
 * No debe mostrarse en listados ni selectores del módulo Clientes.
 */
export const V1_CARGO_PLACEHOLDER_CLIENT_CODE = "9999";

export function isV1CargoPlaceholderClientCode(clientCode: string): boolean {
  return clientCode === V1_CARGO_PLACEHOLDER_CLIENT_CODE;
}
