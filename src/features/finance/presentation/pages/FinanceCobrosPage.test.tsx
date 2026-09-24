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
} from "../utils/cobrosFollowThrough";

const { openPpd, openPpdSummary, registerPayment, repExceptions } = vi.hoisted(
  () => ({
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
  }),
);

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

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOpenPpdInvoices: () => openPpd,
    useOpenPpdSummary: () => openPpdSummary,
    useRegisterFinancePayment: () => registerPayment,
    useRepExceptions: () => repExceptions,
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
    repExceptions.data = undefined;
    repExceptions.isLoading = false;
    repExceptions.isFetched = true;
    repExceptions.isError = false;
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
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

  it("keeps the last cobro lote visible after leaving open-ppd", () => {
    sessionStorage.setItem(
      COBROS_FOLLOW_THROUGH_STORAGE_KEY,
      JSON.stringify({
        paymentId: "pay-1",
        receiverRfc: "XAXX010101000",
        amount: 1160,
        paymentDate: "2026-08-18",
        repStatus: "pending",
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      }),
    );

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobro registrado")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1");
  });

  it("dismisses the follow-through banner and clears sessionStorage", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      COBROS_FOLLOW_THROUGH_STORAGE_KEY,
      JSON.stringify({
        paymentId: "pay-1",
        receiverRfc: "XAXX010101000",
        amount: 1160,
        paymentDate: "2026-08-18",
        repStatus: "pending",
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      }),
    );

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobro registrado")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Cerrar aviso de cobro registrado" }),
    );

    expect(screen.queryByText("Cobro registrado")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY)).toBeNull();
  });

  it("auto-clears the follow-through banner when REP is already stamped", async () => {
    sessionStorage.setItem(
      COBROS_FOLLOW_THROUGH_STORAGE_KEY,
      JSON.stringify({
        paymentId: "pay-1",
        receiverRfc: "XAXX010101000",
        amount: 1160,
        paymentDate: "2026-08-18",
        repStatus: "stamped",
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      }),
    );

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await waitFor(() => {
      expect(screen.queryByText("Cobro registrado")).not.toBeInTheDocument();
    });
    expect(sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY)).toBeNull();
  });

  it("lists a failed REP as work in Cobros with a link to the invoice", async () => {
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
          repLastError: "PAC timeout",
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
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(screen.getByText("Sello fallido")).toBeInTheDocument();
    expect(screen.getByText("Plazo vencido", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.queryByRole("button", { name: /Reintentar sello/i })).not.toBeInTheDocument();
  });
});
