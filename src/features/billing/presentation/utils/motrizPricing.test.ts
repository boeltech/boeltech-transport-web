import { describe, expect, it } from "vitest";
import type { BillingSubscription } from "../../domain/entities";
import {
  computeBolsaStamps,
  computeMotrizCargoCents,
  formatBandQRange,
  isMotrizPricing,
  resolveMotrizBand,
} from "./motrizPricing";

const baseSub = (
  overrides: Partial<BillingSubscription> = {},
): BillingSubscription => ({
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 0,
  includedStamps: 420,
  stampsUsedThisPeriod: 10,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-09-01T06:00:00.000Z",
  currentPeriodEnd: "2026-10-01T05:59:59.999Z",
  trialEndsAt: null,
  notes: null,
  limits: { maxUsers: 10, maxBranches: 3, historyMonths: 12 },
  capacityBandCode: "operacion_pequena",
  pendingCapacityBandCode: null,
  capacity: {
    bandCode: "operacion_pequena",
    pendingBandCode: null,
    users: {
      granted: 10,
      usage: null,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    branches: {
      granted: 3,
      usage: null,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    historyMonths: { granted: 12 },
  },
  profitabilityLevel: "L0",
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
  ...overrides,
});

describe("motrizPricing", () => {
  it("detects v5 band plans and legacy flat plans", () => {
    expect(isMotrizPricing(baseSub())).toBe(true);
    expect(
      isMotrizPricing(
        baseSub({
          planCode: "operacion_esencial",
          pricePerMotrizCents: null,
          bandQMin: null,
          bandQMax: null,
        }),
      ),
    ).toBe(false);
  });

  it("resolves band from plan code and from Q_fact", () => {
    expect(resolveMotrizBand(baseSub())).toBe("pequena");
    expect(
      resolveMotrizBand(
        baseSub({
          planCode: "operacion_mediana",
          bandQMin: 31,
          bandQMax: 100,
          pricePerMotrizCents: 29900,
          qFact: 50,
        }),
      ),
    ).toBe("mediana");
    expect(
      resolveMotrizBand(
        baseSub({
          planCode: "custom",
          bandQMin: null,
          bandQMax: null,
          qFact: 3,
        }),
      ),
    ).toBe("micro");
    expect(
      resolveMotrizBand(
        baseSub({
          planCode: "operacion_grande",
          pricePerMotrizCents: null,
          bandQMin: 101,
          bandQMax: null,
          qFact: 120,
        }),
      ),
    ).toBe("grande");
  });

  it("computes cargo Q×P and bolsa 30×Q (piloto 14×319)", () => {
    expect(computeMotrizCargoCents(14, 31900)).toBe(446600);
    expect(
      computeBolsaStamps({ qFact: 14, stampsPerMotriz: 30 }),
    ).toBe(420);
    expect(computeMotrizCargoCents(null, 31900)).toBeNull();
    expect(computeMotrizCargoCents(14, null)).toBeNull();
  });

  /** DoD piloto CEO (F4): Q=4 Micro $389 → cargo 155600¢ · bolsa 120 */
  it("computes cargo Q×P and bolsa 30×Q (piloto CEO 4×389)", () => {
    expect(computeMotrizCargoCents(4, 38900)).toBe(155600);
    expect(computeBolsaStamps({ qFact: 4, stampsPerMotriz: 30 })).toBe(120);
    expect(
      resolveMotrizBand(
        baseSub({
          planCode: "operacion_micro",
          planName: "Operación Micro",
          pricePerMotrizCents: 38900,
          stampsPerMotriz: 30,
          bandQMin: 1,
          bandQMax: 5,
          overagePriceCents: 600,
          qFact: 4,
          includedStamps: 120,
        }),
      ),
    ).toBe("micro");
  });

  it("formats band Q range", () => {
    expect(formatBandQRange(6, 30)).toBe("6–30");
    expect(formatBandQRange(101, null)).toBe("101+");
  });
});
