import { describe, expect, it } from "vitest";
import type { BillingSubscription } from "@features/billing";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "./platformBillingFormatters";
import { resolvePlatformPlanPriceDisplay } from "./resolvePlatformPlanPriceDisplay";

const base: Pick<
  BillingSubscription,
  | "planCode"
  | "monthlyPriceCents"
  | "pricePerMotrizCents"
  | "bandQMin"
  | "bandQMax"
  | "qFact"
> = {
  planCode: "operacion_pequena",
  monthlyPriceCents: 0,
  pricePerMotrizCents: 31900,
  bandQMin: 6,
  bandQMax: 30,
  qFact: 14,
};

describe("resolvePlatformPlanPriceDisplay", () => {
  it("motriz Q×P: 14 × 31900¢ = 446600¢ ($4,466.00)", () => {
    const display = resolvePlatformPlanPriceDisplay(base);
    expect(display.kind).toBe("motriz_cargo");
    expect(display.cargoCents).toBe(446600);
    expect(display.primary).toBe(formatBillingPriceCents(446600));
    expect(display.secondary).toBe(
      platformCopy.tenants.detail.planPrice.cargoHint(
        formatBillingPriceCents(31900),
        14,
      ),
    );
    expect(display.primary).not.toBe(formatBillingPriceCents(0));
  });

  it("motriz sin Q: muestra $/motriz, no $0 flat", () => {
    const display = resolvePlatformPlanPriceDisplay({
      ...base,
      qFact: null,
    });
    expect(display.kind).toBe("motriz_pending_q");
    expect(display.cargoCents).toBeNull();
    expect(display.primary).toContain("/ motriz");
    expect(display.secondary).toBe(
      platformCopy.tenants.detail.planPrice.pendingQ,
    );
    expect(display.primary).not.toBe(formatBillingPriceCents(0));
  });

  it("Grande / cotización: no inventa P", () => {
    const display = resolvePlatformPlanPriceDisplay({
      planCode: "operacion_grande",
      monthlyPriceCents: 0,
      pricePerMotrizCents: null,
      bandQMin: 101,
      bandQMax: null,
      qFact: 120,
    });
    expect(display.kind).toBe("motriz_quote");
    expect(display.primary).toBe(
      platformCopy.tenants.detail.planPrice.quote,
    );
    expect(display.cargoCents).toBeNull();
  });

  it("legacy flat: monthlyPriceCents", () => {
    const display = resolvePlatformPlanPriceDisplay({
      planCode: "operacion_crecimiento",
      monthlyPriceCents: 150000,
      pricePerMotrizCents: null,
      bandQMin: null,
      bandQMax: null,
      qFact: null,
    });
    expect(display.kind).toBe("legacy_flat");
    expect(display.primary).toBe(formatBillingPriceCents(150000));
    expect(display.secondary).toBeNull();
  });
});
