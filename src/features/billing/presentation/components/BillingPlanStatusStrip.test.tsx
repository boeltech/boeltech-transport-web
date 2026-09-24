import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BillingSubscription } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { BillingPlanStatusStrip } from "./BillingPlanStatusStrip";

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

describe("BillingPlanStatusStrip", () => {
  it("shows plan name and status badge above the fold", () => {
    render(
      <BillingPlanStatusStrip
        subscription={SUB}
        periodLabel={billingCopy.planStatusStrip.periodUntil("30 sep 2026")}
      />,
    );

    expect(screen.getByText("Operación Pequeña")).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.plan.statusLabels.active),
    ).toBeInTheDocument();
    expect(screen.getByText(/hasta 30 sep 2026/)).toBeInTheDocument();
  });

  it("shows loading copy while resolving", () => {
    render(<BillingPlanStatusStrip isLoading />);
    expect(
      screen.getByText(billingCopy.planStatusStrip.loading),
    ).toBeInTheDocument();
  });

  it("renders nothing without subscription when not loading", () => {
    const { container } = render(<BillingPlanStatusStrip subscription={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows cobrado line only when the page passes evidence", () => {
    const { rerender } = render(
      <BillingPlanStatusStrip subscription={SUB} />,
    );
    expect(
      screen.queryByText(billingCopy.planStatusStrip.charged),
    ).not.toBeInTheDocument();

    rerender(
      <BillingPlanStatusStrip
        subscription={SUB}
        chargedLabel={billingCopy.planStatusStrip.chargedPeriod("ago 2026")}
      />,
    );
    expect(
      screen.getByText(billingCopy.planStatusStrip.chargedPeriod("ago 2026")),
    ).toBeInTheDocument();
  });
});
