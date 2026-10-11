import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  FinanceInvoiceListItem,
  FinanceOpenPpdSummary,
  FinanceRepExceptionItem,
} from "@features/finance/domain";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FinanceCobrosPage } from "./FinanceCobrosPage";
import {
  COBROS_FOLLOW_THROUGH_STORAGE_KEY,
  COBROS_TODAY_TRAY_STORAGE_KEY,
} from "../utils/cobrosFollowThrough";
import { REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE } from "@features/finance/domain";

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
    data: undefined as unknown,
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
  }),
}));

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
    getTodayMexicoDateString: () => "2026-09-29",
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

describe("FinanceCobrosPage", () => {
  beforeEach(() => {
    openPpd.data = undefined;
    openPpd.isLoading = false;
    openPpd.isError = false;
    openPpd.isFetching = false;
    openPpdSummary.data = {
      open: 0,
      partial: 0,
      repExceptions: 0,
      totalBalance: 0,
    };
    openPpdSummary.isLoading = false;
    registerPayment.isPending = false;
    registerPayment.mutate = vi.fn();
    repExceptions.data = undefined;
    repExceptions.isLoading = false;
    repExceptions.isFetched = true;
    repExceptions.isError = false;
    repStatusByIds.data = undefined;
    retryFinanceRepStamp.mutate = vi.fn();
    retryFinanceRepStamp.isPending = false;
    retryFinanceRepStamp.variables = undefined;
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
    sessionStorage.removeItem(COBROS_TODAY_TRAY_STORAGE_KEY);
  });

  it("shows the actionable queue without requiring an RFC", () => {
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    openPpdSummary.data = {
      open: 42,
      partial: 7,
      repExceptions: 3,
      totalBalance: 125000.5,
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByRole("heading", { name: "Cobros" })).toBeInTheDocument();
    expect(
      screen.getByText(/Cola de cartera a crédito/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "A-10" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /Por cobrar/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pago parcial/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Excepciones REP/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Vencidas/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Busca al cliente por RFC/)).not.toBeInTheDocument();
  });

  it("applies ?rfc= as a filter chip and clears back to the global queue", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros?rfc=xaxx010101000"],
    });

    expect(screen.getByText("RFC: XAXX010101000")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar filtro RFC: XAXX010101000" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Quitar filtro RFC: XAXX010101000" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("RFC: XAXX010101000")).not.toBeInTheDocument();
    });
  });

  it("allows batch CTA only for invoices of the same RFC", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [
        buildInvoice(),
        buildInvoice({
          id: "inv-2",
          folio: 11,
          receiverRfc: "XEXX010101000",
          receiverName: "Otro Cliente",
        }),
      ],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    expect(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ }),
    ).toHaveLength(1);

    const otherRfc = screen.getAllByRole("checkbox", {
      name: /No seleccionable: factura A-11/,
    })[0]!;
    expect(otherRfc).toBeDisabled();
  });

  it("submits the confirm sheet with the chosen payment date and default midday time", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ })[0]!,
    );

    expect(
      screen.getByRole("heading", { name: "Confirmar cobro" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha del cobro")).toHaveTextContent(
      /29 sep 2026/i,
    );

    await user.click(screen.getByLabelText("Fecha del cobro"));
    await user.click(screen.getByRole("button", { name: "15" }));

    await user.clear(screen.getByLabelText("Hora"));
    await user.click(
      screen.getByRole("button", { name: "Registrar cobro de $1,160.00" }),
    );

    expect(registerPayment.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentDate: "2026-09-15",
        paymentTime: "12:00:00",
        paymentForm: "03",
        amount: 1160,
        allocations: [
          expect.objectContaining({
            ingressInvoiceId: "inv-1",
            amount: 1160,
          }),
        ],
      }),
      expect.anything(),
    );
  });

  it("keeps Cobros de hoy tray after leaving open-ppd (session v2)", () => {
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "pending",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-1",
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
    ];

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Esperando turno")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1");
  });

  it("dismisses the today tray and clears sessionStorage", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "pending",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Cerrar bandeja de cobros de hoy" }),
    );

    expect(screen.queryByText("Cobros de hoy")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).toBeNull();
  });

  it("shows stamped stage in tray without auto-clearing the session entry", () => {
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "stamped",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-1",
        repStatus: "stamped",
        repAttempts: 1,
        repLastError: null,
        repCfdiUuid: "uuid-1",
        repStampedAt: "2026-08-18T12:05:00.000Z",
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: null,
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
    ];

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Comprobante timbrado")).toBeInTheDocument();
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).not.toBeNull();
  });

  it("lists a failed REP with reason and retry CTA (not for manual_review)", async () => {
    const user = userEvent.setup();
    repExceptions.data = {
      data: [
        {
          paymentId: "pay-exc-1",
          paymentDate: "2026-08-01",
          amount: 1160,
          amountMxn: 1160,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: "Error de validación PAC",
          allocations: [
            {
              ingressInvoiceId: "inv-1",
              amount: 1160,
              serie: "A",
              folio: 10,
            },
          ],
          deadlineDate: "2026-09-05",
          deadlineStatus: "overdue",
          daysUntilDeadline: -3,
        },
        {
          paymentId: "pay-exc-2",
          paymentDate: "2026-08-02",
          amount: 500,
          amountMxn: 500,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
          allocations: [
            {
              ingressInvoiceId: "inv-2",
              amount: 500,
              serie: "A",
              folio: 11,
            },
          ],
          deadlineDate: "2026-09-05",
          deadlineStatus: "ok",
          daysUntilDeadline: 10,
        },
      ],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(screen.getAllByText("Timbrado fallido").length).toBeGreaterThan(0);
    expect(screen.getByText("Error de validación PAC")).toBeInTheDocument();
    expect(screen.getByText("Plazo vencido", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1");
    expect(
      screen.getByRole("button", { name: "Reintentar timbrado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE),
    ).toBeInTheDocument();
  });
});
