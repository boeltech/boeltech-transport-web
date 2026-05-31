/**
 * Dueño comercial de mercancía en viajes v1 (ERP `trip_cargos.client_id`).
 *
 * No es el RFC de `Ubicacion` en Carta Porte (eso viene de la parada/dirección).
 * En v1 el usuario no elige dueño de carga: el front envía un UUID centinela y la API
 * lo resuelve al cliente interno `client_code = '9999'` del tenant (migración 070).
 */

/** UUID centinela RFC 4122 (v4) reconocible; la API lo sustituye por el cliente `9999` del tenant. */
export const V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL =
  "00000000-0000-4000-8000-000000009999";

/** Código de catálogo del cliente placeholder en API (solo referencia/documentación). */
export const V1_CARGO_PLACEHOLDER_CLIENT_CODE = "9999";

export function isV1CargoPlaceholderClientId(
  clientId: string | undefined | null,
): boolean {
  return clientId === V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL;
}
