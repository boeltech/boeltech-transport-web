import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { financeCopy } from "../copy";
import { CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY } from "../components/ClientPortalInvoicesOrientationAlert";
import { FinanceInvoicesPage } from "./FinanceInvoicesPage";

const {
  mockUseAuth,
  mockHasPermission,
  mockCanShowInvoiceFromTripCta,
  mockIsFinanceAnalyticsEnabled,
  mockUseFinanceSummary,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockHasPermission: vi.fn(() => false),
  mockCanShowInvoiceFromTripCta: vi.fn(() => false),
  mockIsFinanceAnalyticsEnabled: vi.fn(() => false),
  mockUseFinanceSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: () => undefined,
  };
});

vi.mock("@features/trips", () => ({
  InvoiceableTripPickerSheet: () => null,
}));

vi.mock("@features/invoicing", () => ({
  canShowInvoiceFromTripCta: (...args: unknown[]) =>
    mockCanShowInvoiceFromTripCta(...args),
  InvoiceBulkDownloadSheet: () => null,
  invoiceBulkDownloadCopy: { actionButton: "Descargar CFDI" },
}));

vi.mock("@features/finance/application", () => ({
  isFinanceAnalyticsEnabled: (...args: unknown[]) =>
    mockIsFinanceAnalyticsEnabled(...args),
  useFinanceInvoicesList: () => ({
    data: {
      data: [],
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useFinanceSummary: () => mockUseFinanceSummary(),
  useFinanceListingFilters: () => ({
    search: "",
    page: 1,
    filters: { bucket: "" },
    searchProps: { value: "", onChange: vi.fn(), placeholder: "" },
    activeChips: [],
    hasFilters: false,
    setFilter: vi.fn(),
    setPage: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

function renderPage(role: string) {
  mockUseAuth.mockReturnValue({ user: { role } });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/finance/invoices"]}>
        <FinanceInvoicesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FinanceInvoicesPage — orientación client", () => {
  beforeEach(() => {
    window.localStorage.removeItem(
      CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY,
    );
    mockHasPermission.mockReturnValue(false);
    mockCanShowInvoiceFromTripCta.mockReturnValue(false);
    mockIsFinanceAnalyticsEnabled.mockReturnValue(false);
    mockUseFinanceSummary.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("titula Mis facturas, muestra L1b y no pide Nueva factura", () => {
    renderPage("client");

    expect(
      screen.getByRole("heading", { name: financeCopy.page.portal.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.clientOrientation.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.invoices.empty.noDataClient),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: financeCopy.invoices.newInvoiceCta.label,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Descargar CFDI/i }),
    ).not.toBeInTheDocument();
  });
});

describe("FinanceInvoicesPage — Workbench F1", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (resource: string, action: string) =>
        (resource === "finance" && action === "read") ||
        (resource === "invoices" && action === "execute"),
    );
    mockCanShowInvoiceFromTripCta.mockReturnValue(true);
    mockIsFinanceAnalyticsEnabled.mockReturnValue(true);
    mockUseFinanceSummary.mockReturnValue({
      data: {
        totalReceivable: 0,
        collectedThisMonth: 0,
        totalOverdue: 0,
        expensesThisMonth: 0,
        invoicesByStatus: {
          draft: 2,
          stamped: 5,
          cancellationPending: 0,
          cancelled: 1,
        },
      },
      isLoading: false,
    });
  });

  it("usa shell EmptyState, primary Nueva factura y Descargar CFDI outline", () => {
    renderPage("admin");

    expect(
      screen.getByRole("heading", { name: financeCopy.invoices.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.invoices.newInvoiceCta.emptyDescription),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: financeCopy.invoices.newInvoiceCta.label,
      }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /Descargar CFDI/i }),
    ).toBeInTheDocument();
    // No empty local de tabla (celda "No se encontraron…").
    expect(
      screen.queryByText("No se encontraron facturas."),
    ).not.toBeInTheDocument();
  });

  it("muestra buckets de estado y buscar en el workbench", () => {
    renderPage("admin");

    expect(
      screen.getByRole("tablist", {
        name: financeCopy.invoices.workbench.bucketsAriaLabel,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: new RegExp(financeCopy.invoices.statusLabels.draft, "i"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(financeCopy.invoices.searchPlaceholder),
    ).toBeInTheDocument();
  });
});
