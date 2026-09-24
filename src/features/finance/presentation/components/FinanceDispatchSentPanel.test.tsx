import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { FinanceDispatchSentPanel } from "./FinanceDispatchSentPanel";

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
  SendInvoiceDialog: ({
    invoiceId,
    open,
  }: {
    invoiceId: string;
    open: boolean;
  }) =>
    open ? (
      <div data-testid="send-invoice-dialog">dialog:{invoiceId}</div>
    ) : null,
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
    dispatchSentAt: "2026-08-02T09:00:00.000Z",
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
  requestResend = vi.fn(),
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
    requestResend,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/finance/dispatch?tab=sent"]}>
          <FinanceDispatchSentPanel requestResend={requestResend} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe("FinanceDispatchSentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "execute",
    );
  });

  it("shows Reenviar N with the correct count after multi-client selection", async () => {
    const user = userEvent.setup();
    const { requestResend } = renderPanel();

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-11" })[0]!,
    );

    const resendButton = screen.getByRole("button", {
      name: "Reenviar 2 facturas",
    });
    expect(resendButton).toBeInTheDocument();

    await user.click(resendButton);
    expect(requestResend).toHaveBeenCalledTimes(1);
    expect(requestResend.mock.calls[0]![0]).toHaveLength(2);
  });

  it("opens SendInvoiceDialog from row Reenviar", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(
      screen.getAllByRole("button", { name: "Acciones de factura A-10" })[0]!,
    );
    await user.click(screen.getByRole("menuitem", { name: "Reenviar" }));

    expect(await screen.findByTestId("send-invoice-dialog")).toHaveTextContent(
      "dialog:inv-1",
    );
  });

  it("shows empty state when the sent queue is empty", () => {
    renderPanel(vi.fn(), []);

    expect(
      screen.getByText("Aún no hay facturas enviadas por correo"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir a pendientes" }),
    ).toBeInTheDocument();
  });

  it("hides selection and CTA without invoices.execute", () => {
    mockHasPermission.mockReturnValue(false);
    renderPanel();

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Reenviar/i }),
    ).not.toBeInTheDocument();
  });
});
