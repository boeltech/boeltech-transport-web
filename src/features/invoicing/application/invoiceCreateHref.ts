/**
 * Builder único de href de alta de factura desde un viaje.
 * Scopes: primario (sin scope), accessory, false_trip, split_share.
 */

export type InvoiceCreateHrefParams = {
  tripId: string;
  scope?: "accessory" | "false_trip" | "split_share";
  legId?: string;
  attachCartaPorte?: boolean;
};

export function buildInvoiceCreateHref({
  tripId,
  scope,
  legId,
  attachCartaPorte,
}: InvoiceCreateHrefParams): string {
  const params = new URLSearchParams({ trip_id: tripId });
  if (scope) params.set("scope", scope);
  if (legId) params.set("leg_id", legId);
  if (attachCartaPorte) params.set("attach_carta_porte", "1");
  return `/invoices/new?${params.toString()}`;
}
