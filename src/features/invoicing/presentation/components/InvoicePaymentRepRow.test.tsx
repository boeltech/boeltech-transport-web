import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Payment } from "@features/invoicing/domain";
import { InvoicePaymentRepRow } from "./InvoicePaymentRepRow";

vi.mock("@features/invoicing/application", () => ({
  downloadRepXml: vi.fn(),
  useOpenRepPdf: () => ({ mutate: vi.fn(), isPending: false }),
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
});
