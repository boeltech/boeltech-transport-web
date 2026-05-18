import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FinanceInvoicesTab } from "./FinanceInvoicesTab";
import { FINANCE_INVOICE_FROM_TRIP_CTA } from "../financeInvoiceFromTripCta";

const mockNavigate = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
}));

vi.mock("@shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@shared/hooks")>(
    "@shared/hooks",
  );
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useListingFilters: () => ({
      page: 1,
      search: "",
      searchInput: "",
      filters: { status: "" },
      viewMode: "table" as const,
      hasFilters: false,
      setSearchInput: vi.fn(),
      setFilter: vi.fn(),
      setFilters: vi.fn(),
      setPage: vi.fn(),
      setViewMode: vi.fn(),
      clearAll: vi.fn(),
      searchProps: { value: "", onChange: vi.fn() },
      viewModeProps: { value: "table" as const, onChange: vi.fn() },
      activeChips: [],
    }),
  };
});

vi.mock("@features/invoicing/application", () => ({
  useInvoices: () => ({
    data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useFinanceSummary: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

function renderTab(showFinanceSummaryMetrics = false) {
  return render(
    <MemoryRouter initialEntries={["/finance?tab=invoices"]}>
      <FinanceInvoicesTab showFinanceSummaryMetrics={showFinanceSummaryMetrics} />
    </MemoryRouter>,
  );
}

function grantInvoiceFromTripPermissions() {
  mockHasPermission.mockImplementation(
    (module: string, action: string) =>
      (module === "invoices" && action === "create") ||
      (module === "trips" && action === "read"),
  );
}

describe("FinanceInvoicesTab smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el CTA de facturar cuando hay permisos de crear factura y leer viajes", () => {
    grantInvoiceFromTripPermissions();
    renderTab();

    expect(
      screen.getByTitle(FINANCE_INVOICE_FROM_TRIP_CTA.tooltip),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: FINANCE_INVOICE_FROM_TRIP_CTA.label }),
    ).toHaveLength(2);
    expect(
      screen.getByText(FINANCE_INVOICE_FROM_TRIP_CTA.emptyDescription),
    ).toBeInTheDocument();
  });

  it("oculta el CTA si solo puede leer facturas (p. ej. despachador)", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "read",
    );
    renderTab();

    expect(
      screen.queryByRole("button", { name: FINANCE_INVOICE_FROM_TRIP_CTA.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /facturar desde viaje/i }),
    ).not.toBeInTheDocument();
  });

  it("oculta el CTA si puede crear facturas pero no leer viajes", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "create",
    );
    renderTab();

    expect(
      screen.queryByRole("button", { name: FINANCE_INVOICE_FROM_TRIP_CTA.label }),
    ).not.toBeInTheDocument();
  });

  it("renderiza búsqueda y tabla sin errores con listado vacío", () => {
    grantInvoiceFromTripPermissions();
    renderTab();

    expect(
      screen.getByPlaceholderText("Buscar por cliente, RFC, folio..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No se encontraron facturas" }),
    ).toBeInTheDocument();
  });
});
