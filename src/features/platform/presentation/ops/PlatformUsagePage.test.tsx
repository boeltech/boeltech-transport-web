import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformUsagePage } from "./PlatformUsagePage";
import { opsCopy } from "./opsCopy";

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformBillingReconciliation: () => ({
    data: [
      {
        tenantId: "t1",
        tenantName: "Norte",
        subdomain: "norte",
        planName: "Operación",
        planCode: "operacion",
        stampsUsed: 10,
        includedStamps: 100,
        overageStamps: 0,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePlatformTenantSubscription: () => ({
    data: { qFact: 3 },
    isLoading: false,
  }),
}));

vi.mock("../utils/billingPeriod", () => ({
  getMexicoCityPeriodKey: () => "2026-10",
}));

describe("PlatformUsagePage", () => {
  it("renders OpsTable with column headers", () => {
    renderWithTheme(<PlatformUsagePage />, {
      route: ["/platform/usage"],
    });

    expect(screen.getByTestId("platform-usage-page")).toBeInTheDocument();
    const table = screen.getByTestId("ops-table");
    const heads = within(table).getAllByRole("columnheader");
    expect(heads.map((h) => h.textContent)).toEqual([
      opsCopy.usage.columns.tenant,
      opsCopy.usage.columns.plan,
      opsCopy.usage.columns.stamps,
      opsCopy.usage.columns.overage,
      opsCopy.usage.columns.action,
    ]);
    expect(screen.getByText("Norte")).toBeInTheDocument();
  });
});
