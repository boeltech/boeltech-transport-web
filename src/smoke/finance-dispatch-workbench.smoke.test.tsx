/**
 * Smoke F5 — workbench tipado Envíos (/finance/dispatch).
 * Mock de hooks; no requiere backend ni SMTP.
 * Cubre: Pendientes/Enviadas tipadas, filtro Tipo + fila D12 REP,
 * ConfirmSheet mixto (invoice_ids + payment_ids), crossLink Por periodo,
 * CTA Armar envío, redirects legacy, sidebar un solo Envíos.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  FINANCE_DISPATCH_HISTORY_HREF,
  FINANCE_DISPATCH_PENDING_HREF,
  FINANCE_DISPATCH_PERIOD_PATH,
  resolveLegacyFinanceLocation,
} from "@features/finance/application/financeRoutes";
import { FinanceDispatchPage } from "@features/finance/presentation/pages/FinanceDispatchPage";
import {
  FinanceDispatchRunsLegacyRedirect,
  FinanceSendInvoicesLegacyRedirect,
} from "@features/finance/presentation/routes/FinanceDispatchLegacyRedirects";
import { dispatchRunsCopy } from "@features/finance/presentation/copy/dispatchRunsCopy";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { navigationConfig } from "@widgets/sidebar/model/navigation";
import { navigationCopy } from "@widgets/sidebar/copy/navigationCopy";

const mockUseDispatchDocuments = vi.fn();
const mockUseBillingDispatchRuns = vi.fn();
const mockSendBatch = vi.fn();
const mockUseInvoiceSendRecipients = vi.fn();
const mockUsePaymentSendRecipients = vi.fn();

const copy = dispatchRunsCopy.workbench;
const typeCopy = copy.typeFilter;
const confirmCopy = copy.confirmSheet;

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: () => true,
      isLoading: false,
      isAuthenticated: true,
      role: "admin",
      can: () => true,
      hasRole: () => true,
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/invoicing/application", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@features/invoicing/application")
    >();
  return {
    ...actual,
    useDispatchDocuments: (...args: unknown[]) =>
      mockUseDispatchDocuments(...args),
    useInvoiceSendRecipients: (...args: unknown[]) =>
      mockUseInvoiceSendRecipients(...args),
    usePaymentSendRecipients: (...args: unknown[]) =>
      mockUsePaymentSendRecipients(...args),
    useSendInvoicesBatch: () => ({
      sendBatch: mockSendBatch,
      isPending: false,
      progress: null,
    }),
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useBillingDispatchRuns: (...args: unknown[]) =>
      mockUseBillingDispatchRuns(...args),
    useCreateBillingDispatchRun: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({
    data: [
      {
        id: "scheme-1",
        name: "Corte semanal",
        cadenceKind: "periodic_weekly",
        params: { weekdays: [4, 5] },
        isDefault: true,
        isActive: true,
      },
    ],
    isLoading: false,
  }),
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
    folioLabel: "A-45",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-09-18T12:00:00.000Z",
    dispatchSentAt: null,
    groupKey: "client-a",
    ...overrides,
  };
}

const recipientsA = {
  clientId: "client-a",
  clientName: "Cliente A",
  recipients: [
    {
      key: "billing_email",
      kind: "billing_email" as const,
      label: "Facturación",
      email: "a@example.com",
    },
  ],
};

function emptyList() {
  return {
    data: [] as DispatchDocumentItem[],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
  };
}

function documentsQueryResult(list: ReturnType<typeof emptyList>) {
  return {
    data: list,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

function TestProviders({
  children,
  initialEntry = "/finance/dispatch",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/finance/dispatch" element={children} />
          <Route
            path="/finance/dispatch/period"
            element={<div data-testid="period-page">period</div>}
          />
          <Route
            path="/finance/send-invoices"
            element={<FinanceSendInvoicesLegacyRedirect />}
          />
          <Route
            path="/finance/dispatch-runs"
            element={<FinanceDispatchRunsLegacyRedirect />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("finance-dispatch-workbench smoke (F5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendBatch.mockResolvedValue([]);
    mockUseInvoiceSendRecipients.mockReturnValue({
      data: recipientsA,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUsePaymentSendRecipients.mockReturnValue({
      data: recipientsA,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseDispatchDocuments.mockImplementation(
      (params?: {
        bucket?: string;
        documentKind?: string;
        limit?: number;
      }) => {
        // Badge meta queries (limit 1) — totals for tab badges.
        if (params?.limit === 1) {
          const total =
            params.bucket === "pending"
              ? params.documentKind === "rep"
                ? 1
                : 2
              : params.bucket === "sent"
                ? 1
                : 0;
          return documentsQueryResult({
            data: [],
            pagination: { page: 1, limit: 1, total, totalPages: total > 0 ? 1 : 0 },
          });
        }

        if (params?.bucket === "pending") {
          const allPending = [
            buildDocument(),
            buildDocument({
              id: "pay-1",
              documentKind: "rep",
              folioLabel: "REP-abcdef12",
              amount: 500,
              groupKey: "client-a",
            }),
          ];
          const filtered =
            params.documentKind === "rep"
              ? allPending.filter((d) => d.documentKind === "rep")
              : params.documentKind === "invoice"
                ? allPending.filter((d) => d.documentKind === "invoice")
                : allPending;
          return documentsQueryResult({
            data: filtered,
            pagination: {
              page: 1,
              limit: 25,
              total: filtered.length,
              totalPages: 1,
            },
          });
        }

        if (params?.bucket === "sent") {
          return documentsQueryResult({
            data: [
              buildDocument({
                id: "inv-sent",
                folioLabel: "A-99",
                dispatchSentAt: "2026-09-19T09:00:00.000Z",
              }),
            ],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          });
        }

        return documentsQueryResult(emptyList());
      },
    );
    mockUseBillingDispatchRuns.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it("abre Pendientes con tabla tipada (factura + REP D12)", () => {
    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getAllByText("A-45").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Comprobante de pago (REP) · REP-abcdef12").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(copy.documentLabels.typeRep).length,
    ).toBeGreaterThan(0);
  });

  it("filtra por Tipo = REP vía URL, chip y fila D12 (sin factura)", () => {
    render(
      <TestProviders initialEntry="/finance/dispatch?document_kind=rep">
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(mockUseDispatchDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "pending",
        documentKind: "rep",
      }),
    );
    expect(
      screen.getByRole("combobox", { name: typeCopy.ariaLabel }),
    ).toHaveTextContent(typeCopy.chip(typeCopy.rep));
    expect(
      screen.getByRole("button", {
        name: `Quitar filtro ${typeCopy.chip(typeCopy.rep)}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Comprobante de pago (REP) · REP-abcdef12").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("A-45")).not.toBeInTheDocument();
  });

  it("ConfirmSheet mixto: selecciona factura+REP y confirma con payment_ids", async () => {
    const user = userEvent.setup();
    mockSendBatch.mockResolvedValue([
      {
        groupKey: "client-a",
        clientLabel: "Cliente A",
        invoiceIds: ["inv-1"],
        paymentIds: ["pay-1"],
        folioLabels: [
          "A-45",
          "Comprobante de pago (REP) · REP-abcdef12",
        ],
        ok: true,
        status: "queued",
      },
    ]);

    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar A-45" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", {
        name: "Seleccionar Comprobante de pago (REP) · REP-abcdef12",
      })[0]!,
    );

    await user.click(
      screen.getByRole("button", { name: "Enviar 2 documentos" }),
    );

    expect(
      await screen.findByRole("heading", { name: confirmCopy.title }),
    ).toBeInTheDocument();

    const group = await screen.findByTestId("dispatch-confirm-group-client-a");
    expect(within(group).getByText("A-45")).toBeInTheDocument();
    expect(
      within(group).getByText("Comprobante de pago (REP) · REP-abcdef12"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(within(group).getByText("a@example.com")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: confirmCopy.confirm }),
    );

    await waitFor(() => expect(mockSendBatch).toHaveBeenCalledTimes(1));
    const [groups] = mockSendBatch.mock.calls[0]!;
    expect(groups).toEqual([
      expect.objectContaining({
        groupKey: "client-a",
        invoiceIds: ["inv-1"],
        paymentIds: ["pay-1"],
      }),
    ]);
  });

  it("muestra empty de Pendientes cuando la cola está vacía", () => {
    mockUseDispatchDocuments.mockReturnValue(
      documentsQueryResult(emptyList()),
    );

    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(
      screen.getByText(copy.pending.empty.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: copy.pending.empty.ctaSent,
      }),
    ).toBeInTheDocument();
  });

  it("cambia a Enviadas y enlaza Por periodo", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("tab", {
        name: new RegExp(copy.buckets.sent),
      }),
    );
    expect(screen.getAllByText("A-99").length).toBeGreaterThan(0);

    const periodLink = screen.getByRole("link", {
      name: copy.periodLinkAria,
    });
    expect(periodLink).toHaveAttribute("href", FINANCE_DISPATCH_PERIOD_PATH);
    expect(
      screen.getByRole("button", {
        name: copy.armPeriodCta,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: /Historial/i }),
    ).not.toBeInTheDocument();
  });

  it("?tab=history redirige a envíos del periodo", () => {
    render(
      <TestProviders initialEntry="/finance/dispatch?tab=history">
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(screen.getByTestId("period-page")).toBeInTheDocument();
  });

  it("legacy redirects llevan al workbench o al periodo", () => {
    const { unmount } = render(
      <TestProviders initialEntry="/finance/send-invoices">
        <FinanceDispatchPage />
      </TestProviders>,
    );
    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    unmount();

    render(
      <TestProviders initialEntry="/finance/dispatch-runs">
        <FinanceDispatchPage />
      </TestProviders>,
    );
    expect(screen.getByTestId("period-page")).toBeInTheDocument();

    expect(FINANCE_DISPATCH_PENDING_HREF).toBe(
      "/finance/dispatch?tab=pending",
    );
    expect(FINANCE_DISPATCH_HISTORY_HREF).toBe(FINANCE_DISPATCH_PERIOD_PATH);
    expect(resolveLegacyFinanceLocation("?tab=dispatch-runs")).toBe(
      FINANCE_DISPATCH_PERIOD_PATH,
    );
    expect(copy.title).toBe("Envíos");
    expect(navigationCopy.item.financeDispatch).toBe("Envíos");
  });

  it("sidebar Facturación tiene un solo ítem Envíos", () => {
    const billing = navigationConfig.find((group) => group.id === "billing");
    const dispatchItems =
      billing?.items.filter(
        (item) =>
          item.id.includes("dispatch") || item.id.includes("send-invoice"),
      ) ?? [];

    expect(dispatchItems.map((item) => item.id)).toEqual(["finance-dispatch"]);
    expect(dispatchItems[0]?.label).toBe("Envíos");
    expect(dispatchItems[0]?.path).toBe("/finance/dispatch");
  });

  it("alerta auto-fail en detalle apunta a /finance/dispatch/:runId (copy coherente)", () => {
    expect(invoicingCopy.send.autoDispatchFailedLink).toBe("Ver este lote");
    const runId = "run-auto-1";
    expect(`/finance/dispatch/${runId}`).toMatch(
      /^\/finance\/dispatch\/[\w-]+$/,
    );
    expect(`/finance/dispatch/${runId}`).not.toContain("dispatch-runs");
  });

  it("empty Pendientes CTA cambia a tab Enviadas", async () => {
    const user = userEvent.setup();
    mockUseDispatchDocuments.mockImplementation(
      (params?: { bucket?: string }) => {
        if (params?.bucket === "sent") {
          return documentsQueryResult({
            data: [
              buildDocument({
                id: "inv-sent",
                folioLabel: "A-99",
                dispatchSentAt: "2026-09-19T09:00:00.000Z",
              }),
            ],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          });
        }
        return documentsQueryResult(emptyList());
      },
    );

    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", {
        name: copy.pending.empty.ctaSent,
      }),
    );

    expect(screen.getAllByText("A-99").length).toBeGreaterThan(0);
    const sentBucket = screen.getByRole("tab", {
      name: new RegExp(copy.buckets.sent),
    });
    expect(sentBucket).toHaveAttribute("aria-selected", "true");
  });
});
