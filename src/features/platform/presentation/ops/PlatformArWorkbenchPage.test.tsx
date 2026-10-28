import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./opsTokens.css";
import { PlatformArWorkbenchPage } from "./PlatformArWorkbenchPage";

const {
  mockUsePlatformArList,
  mockUsePlatformArViewCounts,
  mockUsePlatformArCloseRun,
  mockUsePlatformArChargeRun,
  mockUseIssueSaasInvoiceDraft,
  mockUsePlatformAuth,
} = vi.hoisted(() => ({
  mockUsePlatformArList: vi.fn(),
  mockUsePlatformArViewCounts: vi.fn(),
  mockUsePlatformArCloseRun: vi.fn(),
  mockUsePlatformArChargeRun: vi.fn(),
  mockUseIssueSaasInvoiceDraft: vi.fn(),
  mockUsePlatformAuth: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformArList: (...args: unknown[]) => mockUsePlatformArList(...args),
  usePlatformArViewCounts: (...args: unknown[]) =>
    mockUsePlatformArViewCounts(...args),
  usePlatformArCloseRun: (...args: unknown[]) =>
    mockUsePlatformArCloseRun(...args),
  usePlatformArChargeRun: (...args: unknown[]) =>
    mockUsePlatformArChargeRun(...args),
  useIssueSaasInvoiceDraft: (...args: unknown[]) =>
    mockUseIssueSaasInvoiceDraft(...args),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("@features/billing", () => ({
  isStripePublishableConfigured: () => false,
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformTenants: () => ({ data: { data: [] }, isFetching: false }),
  usePlatformTenant: () => ({ data: null }),
}));

vi.mock("./OpsIssueSaasInvoiceSheet", () => ({
  OpsIssueSaasInvoiceSheet: () => null,
}));
vi.mock("./OpsMarkSaasInvoicePaidSheet", () => ({
  OpsMarkSaasInvoicePaidSheet: () => null,
}));
vi.mock("./OpsChargeSaasInvoiceStripeSheet", () => ({
  OpsChargeSaasInvoiceStripeSheet: () => null,
}));
vi.mock("./OpsVoidSaasInvoiceDialog", () => ({
  OpsVoidSaasInvoiceDialog: () => null,
}));

describe("PlatformArWorkbenchPage (craft A / oleada 3)", () => {
  beforeEach(() => {
    mockUsePlatformAuth.mockReturnValue({
      user: { platformRole: "platform_owner" },
    });
    mockUsePlatformArViewCounts.mockReturnValue({
      pending: 1,
      overdue: 0,
      all: 1,
      refetch: vi.fn(),
    });
    mockUsePlatformArCloseRun.mockReturnValue({
      data: {
        data: {
          items: [],
          counts: { actionable: 0 },
          periodKey: "2026-07",
          run: { ran: true, ranAt: null },
        },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUsePlatformArChargeRun.mockReturnValue({
      data: {
        data: {
          items: [],
          latestAttempts: [],
          counts: {
            charged: 0,
            noPaymentMethod: 0,
            failed: 0,
            requiresAction: 0,
            processing: 0,
          },
          run: { ran: false, ranAt: null },
        },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseIssueSaasInvoiceDraft.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsePlatformArList.mockReturnValue({
      data: {
        data: [
          {
            id: "inv-1",
            tenantId: "t-1",
            tenantName: "Acme",
            subdomain: "acme",
            periodKey: "2026-07",
            status: "paid",
            origin: "auto_period_issue",
            totalCents: 10000,
            daysOverdue: 0,
            dueDate: "2026-08-01",
          },
        ],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders Cobranza Money skin without Card light / Finanzas label", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/platform/billing/ar?view=all"]}>
          <div className="platform-ops">
            <PlatformArWorkbenchPage />
          </div>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("ops-ar-workbench")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cobranza" })).toBeInTheDocument();
    expect(screen.getByTestId("ops-money-table")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ar-filters")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toHaveAttribute("data-ops-badge");
    expect(screen.getByText("Auto-emitido")).toBeInTheDocument();
    expect(container.querySelector(".bg-card")).toBeNull();
    expect(screen.queryByText(/Tlamx/i)).toBeNull();
    expect(screen.getByText(/Factura SaaS/i)).toBeInTheDocument();

    const banners = screen.getAllByTestId("ops-ar-banner");
    expect(banners.length).toBeGreaterThan(0);
    for (const banner of banners) {
      expect(banner).toHaveAttribute("data-testid", "ops-ar-banner");
      expect(banner.className).toContain("ops-alert");
    }
    expect(container.querySelector('[data-slot="alert"]')).toBeNull();
    expect(container.querySelector(".bg-destructive")).toBeNull();
  });
});
