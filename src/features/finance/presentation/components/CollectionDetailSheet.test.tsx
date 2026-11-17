/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const paymentDetailMock = vi.fn();
const getByIdMock = vi.fn();

vi.mock("@features/finance/application", async () => {
  const actual = await vi.importActual<
    typeof import("@features/finance/application")
  >("@features/finance/application");
  return {
    ...actual,
    usePaymentCollectionDetail: () => paymentDetailMock(),
    useOperationalReceiptBatch: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useReceiptCollectionDetail: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useRetryPaymentRep: () => ({ mutate: vi.fn(), isPending: false }),
    useOpenPaymentRepPdf: () => ({ mutate: vi.fn(), isPending: false }),
    useDownloadPaymentRepXml: () => ({ mutate: vi.fn(), isPending: false }),
    useVoidOperationalReceiptBatch: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useVoidOperationalCashReceiptFromCollection: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/invoicing", () => ({
  SendRepDialog: () => null,
  invoicingApi: {
    getById: (...args: unknown[]) => getByIdMock(...args),
  },
}));

import { CollectionDetailSheet } from "./CollectionDetailSheet";

const stampedDetail = {
  channel: "with_invoice" as const,
  id: "pay-1",
  clientId: "cli-1",
  clientName: "Cliente Demo",
  amount: 4980,
  currency: "MXN",
  amountMxn: 4980,
  paymentDate: "2026-11-16",
  paymentTime: "12:00:00",
  paymentForm: "03",
  paymentFormName: "Transferencia electrónica",
  reference: "SPEI 8841207",
  notes: null,
  createdByName: "Rosa Alcántara",
  createdAt: "2026-11-16T16:42:00.000Z",
  status: "stamped",
  allocations: [
    {
      id: "a1",
      ingressInvoiceId: "inv-1",
      amount: 4980,
      currency: "MXN",
      serie: "F",
      folio: 1211,
      receiverName: "Cliente Demo",
      repNumParcialidad: 2,
      repImpSaldoAnt: 8180,
      repImpSaldoInsoluto: 3200,
    },
  ],
  comprobante: {
    emits: true as const,
    repStatus: "stamped" as const,
    repSerieFolio: "P-0312",
    repUuid: "UUID-1",
    stampedAt: "2026-11-16T16:43:00.000Z",
    lastError: null,
    repAttempts: 1,
    fiscalDeadline: { date: "2026-12-16", status: "ok" },
    waitReason: null,
    blockingPaymentId: null,
    dispatchSentAt: null,
  },
};

function renderSheet(paymentId = "pay-1") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CollectionDetailSheet
          target={{ kind: "payment", paymentId }}
          open
          onOpenChange={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CollectionDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentDetailMock.mockReturnValue({
      data: stampedDetail,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders with-invoice sheet without Anular and with REP block", () => {
    renderSheet();
    expect(screen.getByText("Cobro")).toBeInTheDocument();
    expect(screen.getByText("Con factura")).toBeInTheDocument();
    expect(screen.getByText("Comprobante de pago")).toBeInTheDocument();
    expect(screen.getByText("P-0312")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Anular cobro/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /Enviar al cliente/i }),
    ).toBeInTheDocument();
  });

  it("shows Parcialidad / Saldo antes / Saldo después numbers (not —)", () => {
    renderSheet();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/\$8,180\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,200\.00/)).toBeInTheDocument();
    expect(screen.queryAllByText("—").length).toBe(0);
  });

  it("Camino A: derives Repartido numbers when allocation REP is null", async () => {
    paymentDetailMock.mockReturnValue({
      data: {
        ...stampedDetail,
        status: "pending",
        allocations: [
          {
            ...stampedDetail.allocations[0],
            repNumParcialidad: null,
            repImpSaldoAnt: null,
            repImpSaldoInsoluto: null,
          },
        ],
        comprobante: {
          ...stampedDetail.comprobante,
          repStatus: "pending" as const,
          repSerieFolio: null,
          repUuid: null,
          stampedAt: null,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    getByIdMock.mockResolvedValue({
      id: "inv-1",
      total: 8180,
      payments: [
        {
          id: "pay-0",
          amountMxn: 3200,
          paymentDate: "2026-10-01",
          paymentTime: "12:00:00",
          repImpPagado: null,
          repImpSaldoAnt: null,
          repImpSaldoInsoluto: null,
          repNumParcialidad: null,
        },
        {
          id: "pay-1",
          amountMxn: 4980,
          paymentDate: "2026-11-16",
          paymentTime: "12:00:00",
          repImpPagado: null,
          repImpSaldoAnt: null,
          repImpSaldoInsoluto: null,
          repNumParcialidad: null,
        },
      ],
    });

    renderSheet();

    await waitFor(() => {
      expect(getByIdMock).toHaveBeenCalledWith("inv-1");
    });
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
      // Saldo antes (4980) + abono + total hero/summary pueden repetir el monto
      expect(screen.getAllByText(/\$4,980\.00/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });
  });
});
