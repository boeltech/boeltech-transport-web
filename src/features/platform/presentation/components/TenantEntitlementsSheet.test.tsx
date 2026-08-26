import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantEntitlementsSheet } from "./TenantEntitlementsSheet";
import { platformApi } from "../../infrastructure/platformApi";
import type {
  PlatformTenantEntitlements,
  PlatformTenantListItem,
} from "../../domain/entities";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantEntitlements: vi.fn(),
    mutateTenantEntitlement: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);

const tenant: PlatformTenantListItem = {
  id: "tenant-1",
  name: "Acme",
  subdomain: "acme",
  status: "active",
  planCode: "operacion_crecimiento",
  planName: "Crecimiento",
  subscriptionStatus: "active",
  declaredFleetBand: null,
  declaredFleetUnits: null,
  userCount: 1,
  branchCount: 1,
  tripCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  suspendedAt: null,
};

const entitlements: PlatformTenantEntitlements = {
  directEntitlements: [],
  effectiveModuleCodes: [],
  profitabilityLevel: "L0",
  catalog: [
    {
      code: "mod_a",
      name: "Modulo A",
      kind: "addon",
      isActiveForTenant: false,
      memberCodes: [],
      priceEaCents: 1000,
      priceGaCents: null,
      maturity: "ga",
    },
    {
      code: "mod_b",
      name: "Modulo B",
      kind: "addon",
      isActiveForTenant: false,
      memberCodes: [],
      priceEaCents: 2000,
      priceGaCents: null,
      maturity: "ga",
    },
  ],
  commercialSummary: {
    periodKey: "2026-08",
    planMonthlyPriceCents: 150000,
    modulesTotalCents: 0,
    overageTotalCents: 0,
    subtotalCents: 150000,
    ivaCents: 24000,
    estimatedTotalCents: 174000,
    currency: "MXN",
    billingCycle: "monthly",
  },
};

describe("TenantEntitlementsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getTenantEntitlements.mockResolvedValue(entitlements);
    mockedApi.mutateTenantEntitlement.mockImplementation(
      () =>
        new Promise(() => {
          /* hang so mutation stays pending */
        }),
    );
  });

  it("disables all switches while any entitlement mutation is pending", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TenantEntitlementsSheet
          tenant={tenant}
          open
          onOpenChange={() => undefined}
          canMutate
        />
      </QueryClientProvider>,
    );

    const switchA = await screen.findByRole("switch", { name: "Modulo A" });
    const switchB = screen.getByRole("switch", { name: "Modulo B" });

    await user.click(switchA);

    await waitFor(() => {
      expect(switchA).toBeDisabled();
      expect(switchB).toBeDisabled();
    });
  });
});
