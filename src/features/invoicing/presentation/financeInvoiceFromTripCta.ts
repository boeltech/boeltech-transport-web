import type { Action, Module } from "@shared/permissions";
import { buildInvoiceCreateHref } from "../application/invoiceCreateHref";

export { invoiceFromTripCta as FINANCE_INVOICE_FROM_TRIP_CTA } from "./copy/invoicingCopy";

type HasPermissionFn = (module: Module, action: Action) => boolean;

export type FinanceHubTripInvoiceSource = {
  id: string;
  operationalOutcome?: string | null;
  invoicing?: {
    hasActiveSplit?: boolean;
    canGenerateInvoice?: boolean;
    canGenerateFalseTripInvoice?: boolean;
    blockReason?: string | null;
  };
};

/**
 * Abre alta desde Finanzas solo si PreStampV2 marca elegible el scope aplicable.
 * ADR-0081: split activo → hub (no alta primaria). Fail-closed si falta el flag.
 */
export function shouldOpenInvoiceCreateFromFinanceHub(
  trip: FinanceHubTripInvoiceSource,
): boolean {
  if (trip.invoicing?.hasActiveSplit === true) {
    return false;
  }
  if (trip.operationalOutcome === "false_trip") {
    return trip.invoicing?.canGenerateFalseTripInvoice === true;
  }
  return trip.invoicing?.canGenerateInvoice === true;
}

export function buildTripInvoicingHubPath(tripId: string): string {
  return `/trips/${tripId}`;
}

/** Alta de factura desde un viaje de la cola Finanzas / picker. */
export function buildInvoiceCreatePathFromTrip(trip: {
  id: string;
  operationalOutcome?: string | null;
}): string {
  return buildInvoiceCreateHref({
    tripId: trip.id,
    scope:
      trip.operationalOutcome === "false_trip" ? "false_trip" : undefined,
  });
}

/** Mismo criterio que `TripInvoiceActions`: crear factura requiere alta en facturas y ver viajes. */
export function canShowInvoiceFromTripCta(
  hasPermission: HasPermissionFn,
): boolean {
  return (
    hasPermission("invoices", "create") && hasPermission("trips", "read")
  );
}
