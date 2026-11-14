import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsManageSubscriptionSheet } from "./OpsManageSubscriptionSheet";
import { platformCopy } from "../copy/platformCopy";

const previewTenantSubscription = vi.fn();
const upsertMutateAsync = vi.fn();

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    previewTenantSubscription: (...args: unknown[]) =>
      previewTenantSubscription(...args),
  },
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: () => ({
    data: [
      {
        code: "operacion_micro",
        name: "Micro",
        isActive: true,
        bandQMin: 1,
        bandQMax: 10,
      },
    ],
  }),
}));

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformTenantSubscription: () => ({
    data: {
      planCode: "operacion_micro",
      status: "paused",
      billingCycle: "monthly",
      trialEndsAt: null,
      notes: null,
    },
  }),
  useUpsertPlatformTenantSubscription: () => ({
    mutateAsync: upsertMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const tenant = {
  id: "t1",
  name: "Demo",
  subdomain: "demo",
  status: "active" as const,
  subscriptionStatus: "paused",
  planCode: "operacion_micro",
  planName: "Micro",
  declaredFleetBand: null,
  declaredFleetUnits: null,
  userCount: 1,
  branchCount: 1,
  tripCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  suspendedAt: null,
  healthScore: 80,
  lifecycleStage: "active" as const,
  healthAsOf: null,
  activeModuleCount: 1,
  activeModuleCodes: ["gps_tracking"],
};

describe("OpsManageSubscriptionSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewTenantSubscription.mockResolvedValue({
      currentStatus: "paused",
      targetStatus: "paused",
      currentPlanCode: "operacion_micro",
      targetPlanCode: "operacion_micro",
      losesOperationalMotriz: true,
      modulesToRevoke: [
        { moduleCode: "gps_tracking", moduleName: "Seguimiento GPS" },
      ],
      warnings: ["ADDONS_WILL_BE_REVOKED", "PERIOD_IN_PROGRESS_BILLED_FULL"],
      effectiveAt: "2026-11-13T18:00:00.000Z",
    });
    upsertMutateAsync.mockResolvedValue({});
  });

  it("shows modules_to_revoke + D7 copy when status loses motriz", async () => {
    renderWithTheme(
      <OpsManageSubscriptionSheet
        tenant={tenant}
        open
        onOpenChange={vi.fn()}
      />,
      { route: ["/platform/tenants/t1"] },
    );

    await waitFor(() => {
      expect(previewTenantSubscription).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("ops-subscription-revoke-preview"),
      ).toBeInTheDocument();
    });

    expect(previewTenantSubscription).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        planCode: "operacion_micro",
        status: "paused",
      }),
    );
    expect(screen.getByText("Seguimiento GPS")).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.manageSubscription.periodBilledFull,
      ),
    ).toBeInTheDocument();
  });
});
