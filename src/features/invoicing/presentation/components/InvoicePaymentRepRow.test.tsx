import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Payment } from "@features/invoicing/domain";
import { InvoicePaymentRepRow } from "./InvoicePaymentRepRow";

vi.mock("@features/invoicing/application", () => ({
  useDownloadRepXml: () => ({ mutate: vi.fn(), isPending: false }),
  useOpenRepPdf: () => ({ mutate: vi.fn(), isPending: false }),
  usePaymentSendRecipients: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSendInvoicesBatch: () => ({
    sendBatch: vi.fn(),
    isPending: false,
    progress: null,
  }),
}));

function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    invoiceId: "inv-1",
    amount: 500,
    currency: "MXN",
    exchangeRate: 1,
    amountMxn: 500,
    paymentDate: "2026-06-01",
    paymentTime: "12:00:00",
    paymentForm: "03",
    paymentFormName: "Transferencia",
    reference: null,
    notes: null,
    createdAt: "2026-06-01T12:00:00.000Z",
    createdByName: null,
    repCfdiUuid: null,
    repStampedAt: null,
    repDispatchSentAt: null,
    repStatus: "failed",
    repAttempts: 1,
    repLastError: "PAC error",
    hasRepXml: false,
    repNumParcialidad: 1,
    repImpSaldoAnt: null,
    repImpSaldoInsoluto: null,
    repImpPagado: null,
    ...overrides,
  };
}

describe("InvoicePaymentRepRow retry gate", () => {
  it("hides retry without invoices.execute", () => {
    render(
      <InvoicePaymentRepRow
        payment={buildPayment()}
        invoiceId="inv-1"
        invoiceSerieFolio="A-100"
        canExportFiles={false}
        canRetryRep={false}
        onRetry={vi.fn()}
        retryingPaymentId={null}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Reintentar sello/i }),
    ).not.toBeInTheDocument();
  });

  it("shows retry with invoices.execute when REP failed", () => {
    render(
      <InvoicePaymentRepRow
        payment={buildPayment()}
        invoiceId="inv-1"
        invoiceSerieFolio="A-100"
        canExportFiles={false}
        canRetryRep
        onRetry={vi.fn()}
        retryingPaymentId={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Reintentar sello/i }),
    ).toBeInTheDocument();
  });

  it("shows Enviar comprobante for stamped REP with execute", () => {
    render(
      <InvoicePaymentRepRow
        payment={buildPayment({
          repStatus: "stamped",
          hasRepXml: true,
          repCfdiUuid: "uuid-1",
          repStampedAt: "2026-06-02T12:00:00.000Z",
        })}
        invoiceId="inv-1"
        invoiceSerieFolio="A-100"
        canExportFiles={false}
        canRetryRep={false}
        canSendRep
        onRetry={vi.fn()}
        retryingPaymentId={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Enviar comprobante" }),
    ).toBeInTheDocument();
  });

  it("shows Reenviar when REP already has dispatch sent mark", () => {
    render(
      <InvoicePaymentRepRow
        payment={buildPayment({
          repStatus: "stamped",
          hasRepXml: true,
          repDispatchSentAt: "2026-06-03T12:00:00.000Z",
        })}
        invoiceId="inv-1"
        invoiceSerieFolio="A-100"
        canExportFiles={false}
        canRetryRep={false}
        canSendRep
        onRetry={vi.fn()}
        retryingPaymentId={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Reenviar" }),
    ).toBeInTheDocument();
  });
});
