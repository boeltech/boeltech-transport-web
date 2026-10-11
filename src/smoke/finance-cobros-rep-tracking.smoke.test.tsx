/**
 * Smoke F1-Web — Cobros: bandeja «Cobros de hoy» + poll rep-status + excepciones.
 * Mock de hooks; no requiere backend ni worker.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  FinanceInvoiceListItem,
  FinanceOpenPpdSummary,
  FinanceRepExceptionItem,
  FinanceRepStatusItem,
} from "@features/finance/domain";
import { REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE } from "@features/finance/domain";
import { FinanceCobrosPage } from "@features/finance/presentation/pages/FinanceCobrosPage";
import {
  COBROS_TODAY_TRAY_STORAGE_KEY,
} from "@features/finance/presentation/utils/cobrosFollowThrough";

const {
  openPpd,
  openPpdSummary,
  registerPayment,
  repExceptions,
  repStatusByIds,
  retryFinanceRepStamp,
} = vi.hoisted(() => ({
  openPpd: {
    data: undefined as
      | {
          data: FinanceInvoiceListItem[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      | undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  },
  openPpdSummary: {
    data: undefined as FinanceOpenPpdSummary | undefined,
    isLoading: false,
    refetch: vi.fn(),
  },
  registerPayment: {
    mutate: vi.fn(),
    isPending: false,
  },
  repExceptions: {
    data: undefined as
      | {
          data: FinanceRepExceptionItem[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      | undefined,
    isLoading: false,
    isFetched: true,
    isError: false,
    refetch: vi.fn(),
  },
  repStatusByIds: {
    data: undefined as FinanceRepStatusItem[] | undefined,
    isLoading: false,
  },
  retryFinanceRepStamp: {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined as { invoiceId: string; paymentId: string } | undefined,
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
    can: () => true,
    hasRole: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/catalogs", () => ({
  useFormaPagoLabel: () => ({
    label: "03 - Transferencia",
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@boeltech/cfdi-domain", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@boeltech/cfdi-domain")>();
  return {
    ...actual,
    getTodayMexicoDateString: () => "2026-10-10",
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOpenPpdInvoices: () => openPpd,
    useOpenPpdSummary: () => openPpdSummary,
    useRegisterFinancePayment: () => registerPayment,
    useRepExceptions: () => repExceptions,
    useRepStatusByIds: () => repStatusByIds,
    useRetryFinanceRepStamp: () => retryFinanceRepStamp,
  };
});

function buildInvoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
    id: "inv-1",
    serie: "A",
    folio: 10,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentMethod: "PPD",
    total: 1160,
    balanceDue: 1160,
    totalPaid: 0,
    tripCodes: ["TRP-001"],
    status: "stamped",
    dispatchSentAt: null,
    ...overrides,
  };
}

function renderCobros() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/finance/cobros"]}>
        <Routes>
          <Route path="/finance/cobros" element={<FinanceCobrosPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke: finance-cobros-rep-tracking", () => {
  beforeEach(() => {
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    openPpd.isLoading = false;
    openPpd.isError = false;
    openPpdSummary.data = {
      open: 1,
      partial: 0,
      repExceptions: 1,
      totalBalance: 1160,
    };
    openPpdSummary.isLoading = false;
    registerPayment.mutate = vi.fn();
    registerPayment.isPending = false;
    repExceptions.data = undefined;
    repStatusByIds.data = undefined;
    retryFinanceRepStamp.mutate = vi.fn();
    sessionStorage.removeItem(COBROS_TODAY_TRAY_STORAGE_KEY);
  });

  it("shows Cobros de hoy stages for multiple session cobros and updates to timbrado", async () => {
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-a",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-10-10",
          repStatus: "pending",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-10-10T12:00:00.000Z",
        },
        {
          paymentId: "pay-b",
          receiverRfc: "XBXX010101000",
          amount: 2000,
          paymentDate: "2026-10-10",
          repStatus: "pending",
          invoices: [{ id: "inv-2", serie: "B", folio: 20, amount: 2000 }],
          recordedAt: "2026-10-10T12:01:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-a",
        repStatus: "pending",
        repAttempts: 0,
        repLastError: null,
        repCfdiUuid: null,
        repStampedAt: null,
        repNextAttemptAt: null,
        waitReason: "queued",
        repErrorKind: null,
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
      {
        paymentId: "pay-b",
        repStatus: "pending",
        repAttempts: 0,
        repLastError: null,
        repCfdiUuid: null,
        repStampedAt: null,
        repNextAttemptAt: null,
        waitReason: "retry_scheduled",
        repErrorKind: null,
        invoices: [{ id: "inv-2", serie: "B", folio: 20, amount: 2000 }],
      },
    ];

    const { rerender } = renderCobros();

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Esperando turno")).toBeInTheDocument();
    expect(screen.getByText("Timbrando…")).toBeInTheDocument();
    expect(screen.queryByText(/N de M/i)).not.toBeInTheDocument();

    repStatusByIds.data = [
      {
        paymentId: "pay-a",
        repStatus: "stamped",
        repAttempts: 1,
        repLastError: null,
        repCfdiUuid: "uuid-a",
        repStampedAt: "2026-10-10T12:02:00.000Z",
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: null,
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
      {
        paymentId: "pay-b",
        repStatus: "stamped",
        repAttempts: 1,
        repLastError: null,
        repCfdiUuid: "uuid-b",
        repStampedAt: "2026-10-10T12:03:00.000Z",
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: null,
        invoices: [{ id: "inv-2", serie: "B", folio: 20, amount: 2000 }],
      },
    ];

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <MemoryRouter initialEntries={["/finance/cobros"]}>
          <Routes>
            <Route path="/finance/cobros" element={<FinanceCobrosPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Comprobante timbrado").length).toBe(2);
    });
  });

  it("does not invite blind retry on manual_review timeout in exceptions", async () => {
    const user = userEvent.setup();
    repExceptions.data = {
      data: [
        {
          paymentId: "pay-manual",
          paymentDate: "2026-10-01",
          amount: 900,
          amountMxn: 900,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
          allocations: [
            {
              ingressInvoiceId: "inv-1",
              amount: 900,
              serie: "A",
              folio: 10,
            },
          ],
          deadlineDate: "2026-11-05",
          deadlineStatus: "ok",
          daysUntilDeadline: 20,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    renderCobros();
    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(
      screen.getByText(REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reintentar timbrado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a factura" }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
  });

  it("multi-invoice Cobros de hoy uses Ver en factura… without auto-nav to [0]", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-multi",
          receiverRfc: "XAXX010101000",
          amount: 2320,
          paymentDate: "2026-10-10",
          repStatus: "stamped",
          invoices: [
            { id: "inv-1", serie: "A", folio: 10, amount: 1160 },
            { id: "inv-2", serie: "A", folio: 25, amount: 1160 },
          ],
          recordedAt: "2026-10-10T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-multi",
        repStatus: "stamped",
        repAttempts: 1,
        repLastError: null,
        repCfdiUuid: "uuid-multi",
        repStampedAt: "2026-10-10T12:02:00.000Z",
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: null,
        invoices: [
          { id: "inv-1", serie: "A", folio: 10, amount: 1160 },
          { id: "inv-2", serie: "A", folio: 25, amount: 1160 },
        ],
      },
    ];

    renderCobros();

    expect(
      screen.queryByRole("link", { name: "Ir a factura" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Ver el cobro en una factura del lote",
      }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
    expect(
      screen.getByRole("menuitem", { name: "Abrir factura A-25" }),
    ).toHaveAttribute("href", "/invoices/inv-2#invoice-payments");
  });
});
