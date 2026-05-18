import type { Action, Module } from "@shared/permissions";

export const FINANCE_INVOICE_FROM_TRIP_CTA = {
  label: "Facturar desde viaje",
  tooltip:
    "Abre el listado de viajes para generar CFDI desde un viaje con facturación disponible",
  emptyDescription:
    "Genera CFDI desde un viaje elegible en el módulo Viajes.",
  tripsPath: "/trips",
} as const;

type HasPermissionFn = (module: Module, action: Action) => boolean;

/** Mismo criterio que `TripInvoiceActions`: crear factura requiere alta en facturas y ver viajes. */
export function canShowInvoiceFromTripCta(
  hasPermission: HasPermissionFn,
): boolean {
  return (
    hasPermission("invoices", "create") && hasPermission("trips", "read")
  );
}
