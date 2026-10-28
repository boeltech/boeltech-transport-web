import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { OpsRegisterPaymentSheet } from "./OpsRegisterPaymentSheet";
import { opsCopy } from "./opsCopy";

const mockInvoices = vi.fn();

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformTenantSaasInvoices: (...args: unknown[]) =>
    mockInvoices(...args),
  useMarkSaasInvoicePaid: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const openInvoice = {
  id: "inv-1",
  tenantId: "t1",
  periodKey: "2026-09",
  status: "open",
  totalCents: 10000,
  dueDate: "2026-10-15T00:00:00.000Z",
} as PlatformSaasInvoice;

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OpsRegisterPaymentSheet
          tenantId="t1"
          tenantLabel="Acme"
          open
          onOpenChange={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OpsRegisterPaymentSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists open SaaS invoices for mark-paid", () => {
    mockInvoices.mockReturnValue({
      data: [openInvoice, { ...openInvoice, id: "inv-2", status: "paid" }],
      isLoading: false,
    });

    renderSheet();

    expect(screen.getByTestId("ops-register-payment-sheet")).toBeInTheDocument();
    expect(
      screen.getByText(/Factura SaaS · no es CFDI de transporte/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.registerPayment.select }),
    ).toBeInTheDocument();
  });

  it("shows empty state when no open invoices", () => {
    mockInvoices.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderSheet();

    expect(screen.getByText(opsCopy.registerPayment.empty)).toBeInTheDocument();
  });
});
