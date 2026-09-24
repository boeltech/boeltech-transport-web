import type { BillingArrearsInvoice } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";

/** Solo si hay last_auto_charge.charged en un periodo pagado visible. */
export function resolveAutoChargeChargedLabel(
  invoices: BillingArrearsInvoice[] | undefined,
  formatPeriod: (periodKey: string) => string,
): string | null {
  const paidCharged = invoices?.find(
    (invoice) =>
      invoice.status === "paid" &&
      invoice.lastAutoCharge?.outcome === "charged",
  );
  if (!paidCharged) return null;
  return billingCopy.planStatusStrip.chargedPeriod(
    formatPeriod(paidCharged.periodKey),
  );
}
