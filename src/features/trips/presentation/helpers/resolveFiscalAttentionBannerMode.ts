import type { Trip, TripInvoicing } from "@features/trips/domain";
import { shouldShowFalseTripCancelCfdiBanner } from "./shouldShowFalseTripCancelCfdiBanner";

/**
 * Discriminador del banner de atención fiscal en detalle de viaje.
 * Orden: false_trip → post-cancel (cancelled) → mid-trip (ADR-0093).
 */
export type FiscalAttentionBannerMode =
  | "none"
  | "falseTrip"
  | "postCancel"
  | "midTrip";

type BannerInvoicing = Pick<
  TripInvoicing,
  "hasActivePrincipalInvoice" | "invoiceId" | "invoiceStatus"
>;

export function resolveFiscalAttentionBannerMode(input: {
  operationalOutcome: Trip["operationalOutcome"];
  requiresFiscalAttention: boolean;
  status: Trip["status"];
  invoicing: BannerInvoicing;
}): FiscalAttentionBannerMode {
  if (input.operationalOutcome === "false_trip") {
    return shouldShowFalseTripCancelCfdiBanner({
      operationalOutcome: input.operationalOutcome,
      requiresFiscalAttention: input.requiresFiscalAttention,
      invoicing: input.invoicing,
    })
      ? "falseTrip"
      : "none";
  }

  if (!input.requiresFiscalAttention) {
    return "none";
  }

  if (input.status === "cancelled") {
    return "postCancel";
  }

  return "midTrip";
}
