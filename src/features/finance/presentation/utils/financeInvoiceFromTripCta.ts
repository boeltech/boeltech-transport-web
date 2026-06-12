import type { Action, Module } from "@shared/permissions";
import { financeCopy } from "../copy";

export const FINANCE_INVOICE_FROM_TRIP_CTA = financeCopy.invoices.fromTripCta;

type HasPermissionFn = (module: Module, action: Action) => boolean;

export function canShowInvoiceFromTripCta(
  hasPermission: HasPermissionFn,
): boolean {
  return (
    hasPermission("invoices", "create") && hasPermission("trips", "read")
  );
}
