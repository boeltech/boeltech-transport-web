import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  FinanceInvoiceListItem,
  FinanceRepExceptionItem,
} from "@features/finance/domain";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FinanceCobrosPage } from "./FinanceCobrosPage";
import {
  COBROS_FOLLOW_THROUGH_STORAGE_KEY,
} from "../utils/cobrosFollowThrough";

const { openPpd, registerPayment, repExceptions } = vi.hoisted(() => ({
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
    isError: false,
    refetch: vi.fn(),
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

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOpenPpdInvoices: () => openPpd,
    useRegisterFinancePayment: () => registerPayment,
    useRepExceptions: () => repExceptions,
  };
});

function buildInvoice(): FinanceInvoiceListItem {
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
  };
}

describe("FinanceCobrosPage", () => {
  beforeEach(() => {
    openPpd.data = undefined;
    openPpd.isLoading = false;
    openPpd.isError = false;
    registerPayment.isPending = false;
    repExceptions.data = undefined;
    repExceptions.isLoading = false;
    repExceptions.isError = false;
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
  });

  it("shows the workbench empty state when there is no rfc", () => {
    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByRole("heading", { name: "Cobros" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Registra cobros por RFC y revisa comprobantes de pago pendientes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Busca al cliente por RFC y elige las facturas que cubre el mismo depósito/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Facturas abiertas a crédito")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Excepciones REP/i })).toBeInTheDocument();
    expect(screen.getByText("Comprobantes por atender")).toBeInTheDocument();
  });

  it("loads invoices from rfc in the URL and compacta the search", async () => {
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
    expect(screen.getAllByRole("link", { name: "A-10" }).length).toBeGreaterThan(0);

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    expect(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ }).length,
    ).toBeGreaterThan(0);
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
