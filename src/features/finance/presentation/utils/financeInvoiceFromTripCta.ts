import type { TripListItem } from "@features/trips/domain";
import {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  shouldOpenInvoiceCreateFromFinanceHub,
} from "@features/invoicing";
import { financeCopy } from "../copy";

/** @deprecated Prefer invoicingCopy / canShowInvoiceFromTripCta from @features/invoicing. */
export const FINANCE_INVOICE_FROM_TRIP_CTA = financeCopy.invoices.fromTripCta;

/**
 * Destino de navegación al elegir un viaje desde el picker «Nueva factura»
 * del tab Facturas. Paridad con FinanceInvoiceableTripsTab (ADR-0081).
 */
export function resolveFinanceInvoicesTabTripTarget(
  trip: Pick<TripListItem, "id" | "operationalOutcome"> & {
    invoicing?: { hasActiveSplit?: boolean };
  },
): string {
  if (shouldOpenInvoiceCreateFromFinanceHub(trip)) {
    return buildInvoiceCreatePathFromTrip(trip);
  }
  return buildTripInvoicingHubPath(trip.id);
}
