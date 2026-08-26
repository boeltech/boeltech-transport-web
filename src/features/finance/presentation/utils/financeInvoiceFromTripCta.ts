import type { TripListItem } from "@features/trips/domain";
import {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  shouldOpenInvoiceCreateFromFinanceHub,
  type FinanceHubTripInvoiceSource,
} from "@features/invoicing";
import { financeCopy } from "../copy";

/** @deprecated Prefer invoicingCopy / canShowInvoiceFromTripCta from @features/invoicing. */
export const FINANCE_INVOICE_FROM_TRIP_CTA = financeCopy.invoices.fromTripCta;

/**
 * Destino de navegación al elegir un viaje desde el picker «Nueva factura»
 * del tab Facturas. Paridad con FinanceInvoiceablePage (ADR-0081 + PreStampV2).
 */
export function resolveFinanceInvoicesTabTripTarget(
  trip: Pick<TripListItem, "id" | "operationalOutcome"> & {
    invoicing?: FinanceHubTripInvoiceSource["invoicing"];
  },
): string {
  if (shouldOpenInvoiceCreateFromFinanceHub(trip)) {
    return buildInvoiceCreatePathFromTrip(trip);
  }
  return buildTripInvoicingHubPath(trip.id);
}
