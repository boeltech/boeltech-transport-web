import { describe, expect, it } from "vitest";
import type { BillingCapacity, BillingSubscription } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { BillingPlanCard } from "./BillingPlanCard";
import { render, screen } from "@testing-library/react";

const withinCapacity = (
  overrides: Partial<BillingCapacity> = {},
): BillingCapacity => ({
  bandCode: "operacion_pequena",
  pendingBandCode: null,
  users: {
    granted: 15,
    usage: 8,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    status: "within_limit",
  },
  branches: {
    granted: 3,
    usage: 2,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    status: "within_limit",
  },
  historyMonths: { granted: 24 },
  ...overrides,
});

const V5_PILOTO: BillingSubscription = {
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 0,
  includedStamps: 420,
  stampsUsedThisPeriod: 12,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-09-01T06:00:00.000Z",
  currentPeriodEnd: "2026-10-01T05:59:59.999Z",
  trialEndsAt: null,
  notes: null,
  limits: { maxUsers: 15, maxBranches: 3, historyMonths: 24 },
  capacityBandCode: "operacion_pequena",
  pendingCapacityBandCode: null,
  capacity: withinCapacity(),
  profitabilityLevel: "L0",
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
};

describe("BillingPlanCard (SoT v5 · ADR-0095)", () => {
  it("muestra $/motriz, banda, Q_fact, bolsa y overage unitario", () => {
    render(
      <BillingPlanCard
        subscription={V5_PILOTO}
        isLoading={false}
        includedStamps={420}
      />,
    );

    expect(screen.getByText("Operación Pequeña")).toBeInTheDocument();
    expect(
      screen.getAllByText(billingCopy.plan.bandLabels.pequena).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/\$319\.00 \/ motriz \/ mes/)).toBeInTheDocument();
    expect(screen.getByText(/14 motrizes este periodo/)).toBeInTheDocument();
    expect(screen.getByText(/420 timbres \(30 × 14\)/)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.00 \/ timbre/)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.plan.noFeeNote)).toBeInTheDocument();
    expect(screen.getByText(/14 × \$319\.00 = \$4,466\.00/)).toBeInTheDocument();
  });

  it("muestra usage/granted de usuarios y sucursales + historial consultable", () => {
    render(
      <BillingPlanCard subscription={V5_PILOTO} isLoading={false} />,
    );

    expect(screen.getByText("8 / 15")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.historyMonthsConsultable(24)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.fields.historyConsultable),
    ).toBeInTheDocument();
    expect(screen.queryByText(/retención/i)).not.toBeInTheDocument();
  });

  it("muestra hint OVER_LIMIT y pending band", () => {
    render(
      <BillingPlanCard
        subscription={{
          ...V5_PILOTO,
          pendingCapacityBandCode: "operacion_micro",
          capacity: withinCapacity({
            pendingBandCode: "operacion_micro",
            users: {
              granted: 5,
              usage: 8,
              limitReached: true,
              overQuota: true,
              overQuotaCount: 3,
              status: "over_limit",
            },
          }),
        }}
        isLoading={false}
      />,
    );

    expect(screen.getByText("8 / 5")).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.overLimitHint),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.pendingBandHint),
    ).toBeInTheDocument();
  });

  it("muestra cotización para banda Grande", () => {
    render(
      <BillingPlanCard
        subscription={{
          ...V5_PILOTO,
          planCode: "operacion_grande",
          planName: "Operación Grande (cotización)",
          pricePerMotrizCents: null,
          bandQMin: 101,
          bandQMax: null,
          overagePriceCents: 300,
          qFact: 120,
        }}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText(billingCopy.plan.pricePerMotrizQuote),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.bandLabels.grande),
    ).toBeInTheDocument();
  });
});
