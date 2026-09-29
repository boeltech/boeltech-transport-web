import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { financeCopy } from "../copy";
import { CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY } from "../components/ClientPortalInvoicesOrientationAlert";
import { FinanceInvoicesPage } from "./FinanceInvoicesPage";

const { mockUseAuth, mockHasPermission } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockHasPermission: vi.fn(() => false),
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
  canShowInvoiceFromTripCta: () => false,
}));

vi.mock("@features/finance/application", () => ({
  isFinanceAnalyticsEnabled: () => false,
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
  useFinanceSummary: () => ({ data: undefined, isLoading: false }),
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
  });
});
