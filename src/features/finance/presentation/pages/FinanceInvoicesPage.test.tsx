import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FinanceInvoiceListItem } from "@features/finance/domain";

import { financeCopy } from "../copy";
import { CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY } from "../components/ClientPortalInvoicesOrientationAlert";
import { FinanceInvoicesPage } from "./FinanceInvoicesPage";

const {
  mockUseAuth,
  mockHasPermission,
  mockCanShowInvoiceFromTripCta,
  mockIsFinanceAnalyticsEnabled,
  mockUseFinanceSummary,
  mockUseFinanceInvoicesList,
  mockNavigate,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockHasPermission: vi.fn((_resource: string, _action: string) => false),
  mockCanShowInvoiceFromTripCta: vi.fn((..._args: unknown[]) => false),
  mockIsFinanceAnalyticsEnabled: vi.fn((..._args: unknown[]) => false),
  mockUseFinanceSummary: vi.fn((): { data: unknown; isLoading: boolean } => ({
    data: undefined,
    isLoading: false,
  })),
  mockUseFinanceInvoicesList: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

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

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    isFinanceAnalyticsEnabled: (...args: unknown[]) =>
      mockIsFinanceAnalyticsEnabled(...args),
    useFinanceInvoicesList: (...args: unknown[]) =>
      mockUseFinanceInvoicesList(...args),
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
  };
});

function emptyListResult() {
  return {
    data: {
      data: [] as FinanceInvoiceListItem[],
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

function buildInvoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
    id: "inv-42",
    serie: "A",
    folio: 42,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentMethod: "PUE",
    total: 1160,
    balanceDue: 1160,
    totalPaid: 0,
    tripCodes: ["TRP-001"],
    status: "stamped",
    dispatchSentAt: null,
    ...overrides,
  };
}

function renderPage(role: string, route = "/finance/invoices") {
  mockUseAuth.mockReturnValue({ user: { role } });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
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
    mockNavigate.mockReset();
    mockHasPermission.mockReturnValue(false);
    mockCanShowInvoiceFromTripCta.mockReturnValue(false);
    mockIsFinanceAnalyticsEnabled.mockReturnValue(false);
    mockUseFinanceSummary.mockReturnValue({ data: undefined, isLoading: false });
    mockUseFinanceInvoicesList.mockReturnValue(emptyListResult());
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
    mockNavigate.mockReset();
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
    mockUseFinanceInvoicesList.mockReturnValue(emptyListResult());
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

  it("al ir a detalle propaga state.from con pathname+search (bucket/filtros)", async () => {
    const user = userEvent.setup();
    mockUseFinanceInvoicesList.mockReturnValue({
      ...emptyListResult(),
      data: {
        data: [buildInvoice()],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
      },
    });

    renderPage("admin", "/finance/invoices?bucket=stamped");

    await user.click(screen.getByText("A-42"));

    expect(mockNavigate).toHaveBeenCalledWith("/invoices/inv-42", {
      state: { from: "/finance/invoices?bucket=stamped" },
    });
  });
});
