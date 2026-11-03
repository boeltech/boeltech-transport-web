import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { FinanceDispatchSentPanel } from "./FinanceDispatchSentPanel";

const mockHasPermission = vi.fn();
const mockUseDispatchDocuments = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/invoicing", () => ({
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
  SendRepDialog: ({
    paymentId,
    open,
  }: {
    paymentId: string;
    open: boolean;
  }) =>
    open ? (
      <div data-testid="send-rep-dialog">dialog:{paymentId}</div>
    ) : null,
}));

vi.mock("@features/invoicing/application", () => ({
  useDispatchDocuments: (...args: unknown[]) =>
    mockUseDispatchDocuments(...args),
}));

function buildDocument(
  overrides: Partial<DispatchDocumentItem> = {},
): DispatchDocumentItem {
  return {
    id: "inv-1",
    documentKind: "invoice",
    clientId: "client-a",
    clientName: "Receptor Demo",
    receiverRfc: "XAXX010101000",
    folioLabel: "A-10",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: "2026-08-02T09:00:00.000Z",
    groupKey: "client-a",
    ...overrides,
  };
}

function renderPanel(
  requestResend = vi.fn(),
  documents: DispatchDocumentItem[] = [
    buildDocument(),
    buildDocument({
      id: "inv-2",
      folioLabel: "A-11",
      clientId: "client-b",
      clientName: "Cliente B",
      receiverRfc: "XEXX010101000",
      groupKey: "client-b",
    }),
  ],
  queryOverrides: {
    isError?: boolean;
    refetch?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const refetch = queryOverrides.refetch ?? vi.fn();
  mockUseDispatchDocuments.mockReturnValue({
    data: queryOverrides.isError
      ? undefined
      : {
          data: documents,
          pagination: {
            page: 1,
            limit: 25,
            total: documents.length,
            totalPages: 1,
          },
        },
    isLoading: false,
    isError: queryOverrides.isError ?? false,
    error: queryOverrides.isError ? new Error("load failed") : null,
    refetch,
    isFetching: false,
  });

  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    requestResend,
    refetch,
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
      screen.getAllByRole("checkbox", { name: "Seleccionar A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar A-11" })[0]!,
    );

    const resendButton = screen.getByRole("button", {
      name: "Reenviar 2 documentos",
    });
    expect(resendButton).toBeInTheDocument();
    expect(resendButton.closest(".sticky")).toBeTruthy();

    await user.click(resendButton);
    expect(requestResend).toHaveBeenCalledTimes(1);
    expect(requestResend.mock.calls[0]![0]).toHaveLength(2);
  });

  it("opens SendInvoiceDialog from row Reenviar for invoices", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(
      screen.getAllByRole("button", { name: "Acciones de A-10" })[0]!,
    );
    await user.click(screen.getByRole("menuitem", { name: "Reenviar" }));

    expect(await screen.findByTestId("send-invoice-dialog")).toHaveTextContent(
      "dialog:inv-1",
    );
  });

  it("opens SendRepDialog from row Reenviar for REP", async () => {
    const user = userEvent.setup();
    renderPanel(vi.fn(), [
      buildDocument({
        id: "pay-9",
        documentKind: "rep",
        folioLabel: "REP-abcdef12",
      }),
    ]);

    await user.click(
      screen.getByRole("button", {
        name: /Acciones de Comprobante de pago/,
      }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Reenviar" }));

    expect(await screen.findByTestId("send-rep-dialog")).toHaveTextContent(
      "dialog:pay-9",
    );
  });

  it("shows empty state when the sent queue is empty", () => {
    renderPanel(vi.fn(), []);

    expect(
      screen.getByText("Aún no hay documentos enviados por correo"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir a pendientes" }),
    ).toBeInTheDocument();
  });

  it("queue load error uses DetailAlertCard with Reintentar in action", async () => {
    const user = userEvent.setup();
    const { refetch } = renderPanel(vi.fn(), [], {
      isError: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    expect(screen.getByText("No se pudo cargar la cola")).toBeInTheDocument();
    expect(
      screen.getByText(/Error al cargar los documentos enviados/),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Reintentar" });
    await user.click(retry);
    expect(refetch).toHaveBeenCalled();
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
