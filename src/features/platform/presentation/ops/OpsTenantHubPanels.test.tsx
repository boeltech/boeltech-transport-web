import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsTenantHealthPanel } from "./OpsTenantHealthPanel";
import { OpsTenantSubscriptionPanel } from "./OpsTenantSubscriptionPanel";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformTenantSubscription: () => ({
    data: {
      planCode: "operacion_crecimiento",
      planName: "Operación",
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: "2026-10-01T00:00:00.000Z",
      currentPeriodEnd: "2026-10-31T23:59:59.000Z",
      profitabilityLevel: "L1",
      notes: null,
      trialEndsAt: null,
      limits: { maxUsers: 10, maxBranches: 2, historyMonths: 12 },
      capacity: null,
      qFact: 5,
      stampsPerMotriz: 30,
      includedStamps: 150,
      stampsUsedThisPeriod: 10,
      pendingCapacityBandCode: null,
      pricePerMotrizCents: 9900,
      monthlyPriceCents: null,
      bandQMin: 1,
      bandQMax: 10,
    },
    isLoading: false,
    isError: false,
  }),
}));

describe("Ops hub panels (Ola 4)", () => {
  it("health panel uses OpsPanel not Card", () => {
    const health = {
      ...emptyPlatformTenantHealth(),
      score: 82,
      asOf: "2026-10-01T00:00:00.000Z",
      signals: {
        fiscal: 80,
        payment: 70,
        adoption: 90,
        fleet: 75,
        engagement: 85,
      },
      weights: {
        fiscal: 0.2,
        payment: 0.2,
        adoption: 0.2,
        fleet: 0.2,
        engagement: 0.2,
      },
    };

    renderWithTheme(<OpsTenantHealthPanel health={health} />);
    const panel = screen.getByTestId("ops-tenant-health");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass("ops-panel");
  });

  it("subscription panel uses OpsPanel", () => {
    renderWithTheme(<OpsTenantSubscriptionPanel tenantId="t1" />);
    expect(screen.getByTestId("ops-tenant-subscription")).toBeInTheDocument();
    expect(screen.getByText("Operación")).toBeInTheDocument();
  });
});
