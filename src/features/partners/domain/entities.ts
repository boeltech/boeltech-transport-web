/**
 * Catálogo unificado de contrapartes fiscales (RFC + razón social).
 * Persistencia en backend; el viaje guarda partnerId + snapshot en paradas.
 */

export interface Partner {
  readonly id: string;
  readonly legalName: string;
  readonly taxId: string;
}
