import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  BillingCommercialSummary,
  BillingSubscription,
  BillingUsage,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { BillingPlanSummary } from "./BillingPlanSummary";

const SUB: BillingSubscription = {
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
  capacity: {
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
  },
  profitabilityLevel: "L0",
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
};

const USAGE: BillingUsage = {
  tenantId: "t1",
  planCode: "operacion_pequena",
  periodKey: "2026-09",
  currentPeriodStart: "2026-09-01T06:00:00.000Z",
  currentPeriodEnd: "2026-10-01T05:59:59.999Z",
  includedStamps: 420,
  stampsUsed: 12,
  overageStamps: 0,
  overagePriceCents: 500,
  overageTotalCents: 0,
  quotaPolicy: "soft_cap",
  prepaidRemaining: 0,
  prepaidConsumed: 0,
  history: [],
};

const SUMMARY: BillingCommercialSummary = {
  planMonthlyPriceCents: 446600,
  modulesTotalCents: 0,
  overageTotalCents: 0,
  subtotalCents: 446600,
  ivaCents: 71456,
  estimatedTotalCents: 518056,
  currency: "MXN",
  periodKey: "2026-09",
  billingCycle: "monthly",
};

describe("BillingPlanSummary", () => {
  it("unifies plan, motriz price, estimate and stamp progress above the fold", () => {
    render(
      <BillingPlanSummary
        subscription={SUB}
        periodLabel={billingCopy.planStatusStrip.periodUntil("30 sep 2026")}
        commercialSummary={SUMMARY}
        usage={USAGE}
        usagePercent={3}
        stampsRemaining={408}
      />,
    );

    expect(screen.getByText("Operación Pequeña")).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.statusLabels.active),
    ).toBeInTheDocument();
    expect(screen.getByText(/hasta 30 sep 2026/)).toBeInTheDocument();
    expect(screen.getByText(/\$319\.00 \/ motriz \/ mes/)).toBeInTheDocument();
    expect(screen.getByText(/14 motrizes este periodo/)).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.planSummary.estimatedLabel),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$5,180\.56/)).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.stamps.summary(12, 420)),
    ).toBeInTheDocument();
  });

  it("shows loading copy while subscription resolves", () => {
    render(
      <BillingPlanSummary
        isLoadingSubscription
        usagePercent={0}
        stampsRemaining={0}
      />,
    );
    expect(
      screen.getByText(billingCopy.planSummary.loading),
    ).toBeInTheDocument();
  });

  it("renders nothing without subscription when not loading", () => {
    const { container } = render(
      <BillingPlanSummary
        subscription={null}
        usagePercent={0}
        stampsRemaining={0}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
