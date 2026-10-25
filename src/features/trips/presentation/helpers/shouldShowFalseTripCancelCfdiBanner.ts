import type { Trip, TripInvoicing } from "@features/trips/domain";

type CancelCfdiBannerInvoicing = Pick<TripInvoicing, "hasActivePrimaryInvoice">;

/**
 * Gate del banner «Cancela la factura de flete» (ADR-0079 / web #32).
 * Solo cuando hay flete `primary_transport` vigente — no el ingreso `false_trip`.
 */
export function shouldShowFalseTripCancelCfdiBanner(input: {
  operationalOutcome: Trip["operationalOutcome"];
  requiresFiscalAttention: boolean;
  invoicing: CancelCfdiBannerInvoicing;
}): boolean {
  if (input.operationalOutcome !== "false_trip") return false;
  if (!input.requiresFiscalAttention) return false;
  return input.invoicing.hasActivePrimaryInvoice;
}
