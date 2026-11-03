import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { FinanceDispatchPendingPanel } from "./FinanceDispatchPendingPanel";

const mockHasPermission = vi.fn();
const mockUseDispatchDocuments = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
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
    clientName: "Cliente A",
    receiverRfc: "XAXX010101000",
    folioLabel: "A-10",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    groupKey: "client-a",
    ...overrides,
  };
}

function renderPanel(
  requestSend = vi.fn(),
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
  initialEntry = "/finance/dispatch",
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
    requestSend,
    refetch,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialEntry]}>
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
      screen.getAllByRole("checkbox", { name: "Seleccionar A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar A-11" })[0]!,
    );

    const sendButton = screen.getByRole("button", {
      name: "Enviar 2 documentos",
    });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton.closest(".sticky")).toBeTruthy();

    await user.click(sendButton);
    expect(requestSend).toHaveBeenCalledTimes(1);
    expect(requestSend.mock.calls[0]![0]).toHaveLength(2);
  });

  it("renders typed REP rows with D12 label", () => {
    renderPanel(vi.fn(), [
      buildDocument({
        id: "pay-1",
        documentKind: "rep",
        folioLabel: "REP-abcdef12",
        groupKey: "client-a",
      }),
    ]);

    expect(
      screen.getAllByText("Comprobante de pago (REP) · REP-abcdef12").length,
    ).toBeGreaterThan(0);
  });

  it("shows empty state when the pending queue is empty", () => {
    renderPanel(vi.fn(), []);

    expect(
      screen.getByText("Todos los documentos listos ya fueron enviados"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver enviadas" }),
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
      screen.getByText(/Error al cargar los documentos pendientes de envío/),
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
      screen.queryByRole("button", { name: /Enviar/i }),
    ).not.toBeInTheDocument();
  });

  it("passes document_kind filter from URL to the list hook", () => {
    renderPanel(vi.fn(), [], {}, "/finance/dispatch?document_kind=rep");

    expect(mockUseDispatchDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "pending",
        documentKind: "rep",
      }),
    );
  });
});
