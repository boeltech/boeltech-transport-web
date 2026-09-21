import type { BillingSubscription } from "@features/billing";
import {
  computeMotrizCargoCents,
  isMotrizPricing,
  resolveMotrizBand,
} from "@features/billing";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "./platformBillingFormatters";

export type PlatformPlanPriceKind =
  | "motriz_cargo"
  | "motriz_pending_q"
  | "motriz_quote"
  | "legacy_flat";

export type PlatformPlanPriceDisplay = {
  kind: PlatformPlanPriceKind;
  /** Hero / valor de fila (importe formateado o label de cotización). */
  primary: string;
  /** Línea secundaria (fórmula, pending Q, hint SOW). */
  secondary: string | null;
  /** Cargo Q×P en centavos cuando kind = motriz_cargo. */
  cargoCents: number | null;
};

type SubscriptionPriceFields = Pick<
  BillingSubscription,
  | "planCode"
  | "monthlyPriceCents"
  | "pricePerMotrizCents"
  | "bandQMin"
  | "bandQMax"
  | "qFact"
>;

/**
 * Precio a mostrar en cards platform (SoT v5).
 * No inventa P: reutiliza `computeMotrizCargoCents` / `isMotrizPricing`.
 */
export function resolvePlatformPlanPriceDisplay(
  sub: SubscriptionPriceFields,
): PlatformPlanPriceDisplay {
  const copy = platformCopy.tenants.detail.planPrice;
  const motriz = isMotrizPricing(sub);
  const band = resolveMotrizBand(sub);
  const unitCents = sub.pricePerMotrizCents;
  const hasUnitPrice = unitCents != null && unitCents > 0;

  if (motriz) {
    const isQuote = band === "grande" || !hasUnitPrice;
    if (isQuote) {
      return {
        kind: "motriz_quote",
        primary: copy.quote,
        secondary: copy.quoteHint,
        cargoCents: null,
      };
    }

    const cargoCents = computeMotrizCargoCents(sub.qFact, unitCents);
    const unitLabel = formatBillingPriceCents(unitCents!);

    if (cargoCents != null && sub.qFact != null) {
      return {
        kind: "motriz_cargo",
        primary: formatBillingPriceCents(cargoCents),
        secondary: copy.cargoHint(unitLabel, sub.qFact),
        cargoCents,
      };
    }

    return {
      kind: "motriz_pending_q",
      primary: copy.pricePerMotriz(unitLabel),
      secondary: copy.pendingQ,
      cargoCents: null,
    };
  }

  return {
    kind: "legacy_flat",
    primary: formatBillingPriceCents(sub.monthlyPriceCents),
    secondary: null,
    cargoCents: null,
  };
}
