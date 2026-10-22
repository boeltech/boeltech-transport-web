import type { FiscalAttentionBannerMode } from "./resolveFiscalAttentionBannerMode";

/**
 * Which ATF DetailAlertCard to mount on trip detail.
 * Precedence: falseTrip > partial > postCancel > midTrip (one banner).
 * PD1 / D1: independent of invoicing console visibility — callers must not
 * suppress these slots when `shouldShowTripInvoicingConsole` is true.
 */
export type FiscalAttentionAlertSlot =
  | "none"
  | "falseTrip"
  | "partialSubstitution"
  | "postCancel"
  | "midTrip";

export function resolveFiscalAttentionAlertSlot(input: {
  mode: FiscalAttentionBannerMode;
  freightHasPartialSubstitution: boolean;
}): FiscalAttentionAlertSlot {
  switch (input.mode) {
    case "falseTrip":
      return "falseTrip";
    case "postCancel":
      return "postCancel";
    case "midTrip":
      return input.freightHasPartialSubstitution
        ? "partialSubstitution"
        : "midTrip";
    case "none":
    default:
      return "none";
  }
}
