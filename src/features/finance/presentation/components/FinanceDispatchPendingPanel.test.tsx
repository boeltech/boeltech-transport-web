import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { FinanceDispatchPendingPanel } from "./FinanceDispatchPendingPanel";

const mockHasPermission = vi.fn();
const mockUseInvoices = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/invoicing", () => ({
  useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
}));

function buildInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "t-1",
    serie: "A",
    folio: 10,
    cfdiUuid: null,
    receiverRfc: "XAXX010101000",
    receiverName: "Receptor Demo",
    clientId: "client-a",
    clientName: "Cliente A",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    tripCount: 1,
    tripCodes: ["TRP-001"],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-08-01T10:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

function renderPanel(
  requestSend = vi.fn(),
  invoices: InvoiceListItem[] = [
    buildInvoice(),
    buildInvoice({
      id: "inv-2",
      folio: 11,
      clientId: "client-b",
      clientName: "Cliente B",
      receiverRfc: "XEXX010101000",
    }),
  ],
) {
  mockUseInvoices.mockReturnValue({
    data: {
      data: invoices,
      pagination: { page: 1, limit: 25, total: invoices.length, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  });

  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    requestSend,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/finance/dispatch"]}>
          <FinanceDispatchPendingPanel requestSend={requestSend} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe("FinanceDispatchPendingPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "execute",
    );
  });

  it("shows Enviar N with the correct count after multi-client selection", async () => {
    const user = userEvent.setup();
    const { requestSend } = renderPanel();

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-11" })[0]!,
    );

    const sendButton = screen.getByRole("button", {
      name: "Enviar 2 facturas",
    });
    expect(sendButton).toBeInTheDocument();

    await user.click(sendButton);
    expect(requestSend).toHaveBeenCalledTimes(1);
    expect(requestSend.mock.calls[0]![0]).toHaveLength(2);
  });

  it("shows empty state when the pending queue is empty", () => {
    renderPanel(vi.fn(), []);

    expect(
      screen.getByText("Todas las facturas timbradas ya fueron enviadas"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver facturas enviadas" }),
    ).toBeInTheDocument();
  });

  it("hides selection and CTA without invoices.execute", () => {
    mockHasPermission.mockReturnValue(false);
    renderPanel();

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar/i }),
    ).not.toBeInTheDocument();
  });
});
