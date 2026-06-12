import type { Action, Module } from "@shared/permissions";

export { invoiceFromTripCta as FINANCE_INVOICE_FROM_TRIP_CTA } from "./copy/invoicingCopy";

type HasPermissionFn = (module: Module, action: Action) => boolean;

/** Mismo criterio que `TripInvoiceActions`: crear factura requiere alta en facturas y ver viajes. */
export function canShowInvoiceFromTripCta(
  hasPermission: HasPermissionFn,
): boolean {
  return (
    hasPermission("invoices", "create") && hasPermission("trips", "read")
  );
}
