import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsChangePlanSheet } from "./OpsChangePlanSheet";
import { opsCopy } from "./opsCopy";
import type { PlatformTenantListItem } from "../../domain/entities";

const previewTenantPlan = vi.fn();
const assignTenantPlan = vi.fn();

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    previewTenantPlan: (...args: unknown[]) => previewTenantPlan(...args),
    assignTenantPlan: (...args: unknown[]) => assignTenantPlan(...args),
  },
}));

const PLANS = [
  {
    code: "operacion_crecimiento",
    name: "Operación Crecimiento",
    isActive: true,
    maxUsers: 20,
    maxBranches: 5,
    historyMonths: 12,
    monthlyPriceCents: 0,
    annualPriceCents: null,
    includedStamps: 0,
    overagePriceCents: 0,
    quotaPolicy: "soft_cap",
    features: {},
    pricePerMotrizCents: null,
    stampsPerMotriz: 30,
    bandQMin: 11,
    bandQMax: 30,
  },
];

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: () => ({
    data: PLANS,
    isLoading: false,
  }),
  useAssignPlatformTenantPlan: () => ({
    mutateAsync: assignTenantPlan,
    isPending: false,
  }),
}));

const tenant: PlatformTenantListItem = {
  id: "t1",
  name: "Demo SA",
  subdomain: "demo",
  status: "active",
  subscriptionStatus: "active",
  planCode: "operacion_esencial",
  planName: "Operación Esencial",
  declaredFleetBand: null,
  declaredFleetUnits: null,
  userCount: 1,
  branchCount: 1,
  tripCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  suspendedAt: null,
  healthScore: null,
  lifecycleStage: "active",
  healthAsOf: null,
};

describe("OpsChangePlanSheet", () => {
  beforeEach(() => {
    previewTenantPlan.mockReset();
    assignTenantPlan.mockReset();
    previewTenantPlan.mockResolvedValue({
      current: {
        planCode: "operacion_esencial",
        name: "Operación Esencial",
        maxUsers: 10,
        maxBranches: 2,
        historyMonths: 6,
      },
      target: {
        planCode: "operacion_crecimiento",
        name: "Operación Crecimiento",
        maxUsers: 20,
        maxBranches: 5,
        historyMonths: 12,
      },
      modulesGained: [],
      modulesLost: [],
      capacityDelta: {
        maxUsers: { from: 10, to: 20, delta: 10 },
        maxBranches: { from: 2, to: 5, delta: 3 },
        historyMonths: { from: 6, to: 12, delta: 6 },
        includedStamps: { from: 0, to: 0, delta: 0 },
        stampsPerMotriz: { from: 30, to: 30, delta: 0 },
      },
      priceEstimate: {
        currency: "MXN",
        estimatedMonthlyCents: null,
        estimateAvailable: false,
      },
      effectiveAt: "2026-10-27T12:00:00.000Z",
      warnings: [],
    });
    assignTenantPlan.mockResolvedValue({
      data: {
        tenant: {
          id: "t1",
          name: "Demo SA",
          subdomain: "demo",
          status: "active",
          planCode: "operacion_crecimiento",
          suspendedAt: null,
        },
        plan: {
          code: "operacion_crecimiento",
          name: "Operación Crecimiento",
          maxUsers: 20,
          maxBranches: 5,
          historyMonths: 12,
        },
      },
    });
  });

  it("shows price pending from preview and applies with reason", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <OpsChangePlanSheet
        tenant={tenant}
        open
        onOpenChange={vi.fn()}
        initialPlanCode="operacion_crecimiento"
      />,
    );

    expect(screen.getByTestId("ops-change-plan-sheet")).toBeInTheDocument();

    await waitFor(() => {
      expect(previewTenantPlan).toHaveBeenCalledWith(
        "t1",
        "operacion_crecimiento",
      );
    });

    expect(
      await screen.findByText(opsCopy.preview.pricePending),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(opsCopy.preview.reasonLabel),
      "Upgrade solicitado por deal desk",
    );
    await user.click(
      screen.getByRole("button", { name: opsCopy.preview.apply }),
    );

    await waitFor(() => {
      expect(assignTenantPlan).toHaveBeenCalledWith({
        tenantId: "t1",
        payload: {
          planCode: "operacion_crecimiento",
          reason: "Upgrade solicitado por deal desk",
        },
      });
    });
  });
});
