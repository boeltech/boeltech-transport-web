import type { Trip, TripInvoicing } from "@features/trips/domain";

type CancelCfdiBannerInvoicing = Pick<
  TripInvoicing,
  "hasActivePrincipalInvoice" | "invoiceId" | "invoiceStatus"
>;

/**
 * Gate del banner «Cancela la factura de flete» (ADR-0079 / web #32).
 * Defensa UI: no pedir cancel si no hay principal vigente (post-cancel o invoice_id stale).
 */
export function shouldShowFalseTripCancelCfdiBanner(input: {
  operationalOutcome: Trip["operationalOutcome"];
  requiresFiscalAttention: boolean;
  invoicing: CancelCfdiBannerInvoicing;
}): boolean {
  if (input.operationalOutcome !== "false_trip") return false;
  if (!input.requiresFiscalAttention) return false;

  const { hasActivePrincipalInvoice, invoiceId, invoiceStatus } =
    input.invoicing;

  if (hasActivePrincipalInvoice) return true;

  return (
    Boolean(invoiceId) &&
    (invoiceStatus === "stamped" || invoiceStatus === "cancellation_pending")
  );
}
