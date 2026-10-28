import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./opsTokens.css";
import { OpsTenantSaasArPanel } from "./OpsTenantSaasArPanel";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/billing", () => ({
  isSaasStripeNotConfiguredError: () => false,
  isStripePublishableConfigured: () => false,
}));

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformTenantSaasInvoices: () => ({
    data: [
      {
        id: "inv-1",
        tenantId: "tenant-1",
        periodKey: "2026-07",
        status: "paid",
        origin: "auto_period_issue",
        totalCents: 150000,
        daysOverdue: 0,
        dueDate: "2026-08-01",
        paidAt: "2026-07-28T12:00:00.000Z",
        lastPayment: { method: "spei" },
      },
    ],
    isLoading: false,
  }),
  usePlatformArCloseRun: () => ({
    data: { data: { items: [] } },
    isLoading: false,
  }),
  usePlatformArChargeRun: () => ({
    data: {
      data: { latestAttempts: [], items: [], counts: {}, run: { ran: false } },
    },
    isLoading: false,
  }),
  usePlatformTenantPaymentMethods: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useIssueSaasInvoiceDraft: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../utils/autoChargeChip", () => ({
  resolveAutoChargeChip: () => "charged",
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

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <div className="platform-ops">
          <OpsTenantSaasArPanel tenantId="tenant-1" canMutate={false} />
        </div>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OpsTenantSaasArPanel (Ola 2)", () => {
  it("renders Money table + OpsBadge without Card light", () => {
    const { container } = renderPanel();
    expect(screen.getByTestId("ops-tenant-saas-ar")).toBeInTheDocument();
    expect(screen.getByTestId("ops-money-table")).toBeInTheDocument();
    expect(container.querySelector(".bg-card")).toBeNull();
    expect(container.querySelector("[data-slot='card']")).toBeNull();
    expect(screen.getByText("Pagado")).toHaveAttribute("data-ops-badge");
    expect(screen.getByText("Auto-emitido")).toBeInTheDocument();
    expect(screen.queryByText("Cobrado")).not.toBeInTheDocument();
    expect(screen.queryByText(/Finanzas/i)).toBeNull();
  });
});
