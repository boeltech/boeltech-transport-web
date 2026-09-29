import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingSaasInvoice } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/billingFormatters";
import { BillingSaasInvoiceHistoryCard } from "./BillingSaasInvoiceHistoryCard";

const PAID: BillingSaasInvoice = {
  id: "inv-paid",
  periodKey: "2026-07",
  status: "paid",
  totalCents: 215424,
  amountDueCents: 0,
  issuedAt: "2026-08-01T16:00:00.000Z",
  dueDate: "2026-08-15T05:59:59.999Z",
  paidAt: "2026-08-03T18:00:00.000Z",
  origin: "auto_period_issue",
  lastPayment: {
    paidAt: "2026-08-03T18:00:00.000Z",
    method: "stripe",
  },
};

const VOID_INVOICE: BillingSaasInvoice = {
  id: "inv-void",
  periodKey: "2026-06",
  status: "void",
  totalCents: 98000,
  amountDueCents: 0,
  issuedAt: "2026-07-01T12:00:00.000Z",
  dueDate: "2026-07-15T05:59:59.999Z",
  paidAt: null,
  origin: "manual",
  lastPayment: null,
};

describe("BillingSaasInvoiceHistoryCard", () => {
  it("renders paid row with month, amount, collected date and method", () => {
    render(<BillingSaasInvoiceHistoryCard invoices={[PAID]} />);

    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.status.paid),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatBillingPriceCents(215424)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDate("2026-08-03T18:00:00.000Z")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.methods.stripe),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(billingCopy.arrears.payNow),
    ).not.toBeInTheDocument();
  });

  it("never paints due_date on paid or void rows (D2)", () => {
    render(<BillingSaasInvoiceHistoryCard invoices={[PAID, VOID_INVOICE]} />);

    expect(
      screen.queryByText(formatDate("2026-08-15T05:59:59.999Z")),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(formatDate("2026-07-15T05:59:59.999Z")),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/vence/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.status.void),
    ).toBeInTheDocument();
  });

  it("maps Cómo labels and em dash when last_payment is null", () => {
    render(
      <BillingSaasInvoiceHistoryCard
        invoices={[
          { ...PAID, id: "spei", lastPayment: { ...PAID.lastPayment!, method: "spei" } },
          {
            ...PAID,
            id: "manual",
            lastPayment: { ...PAID.lastPayment!, method: "manual" },
          },
          {
            ...PAID,
            id: "other",
            lastPayment: { ...PAID.lastPayment!, method: "other" },
          },
          {
            ...PAID,
            id: "card-ext",
            lastPayment: { ...PAID.lastPayment!, method: "card_external" },
          },
          { ...VOID_INVOICE, lastPayment: null },
        ]}
      />,
    );

    expect(screen.getByText("Transferencia")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Otro")).toBeInTheDocument();
    expect(screen.getAllByText("Tarjeta").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(billingCopy.saasInvoiceHistory.methodUnknown).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state instead of a mute hole", () => {
    render(<BillingSaasInvoiceHistoryCard invoices={[]} />);

    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.empty),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: billingCopy.saasInvoiceHistory.columns.period,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows loading and error copy", () => {
    const { rerender } = render(
      <BillingSaasInvoiceHistoryCard invoices={[]} isLoading />,
    );
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.loading),
    ).toBeInTheDocument();

    rerender(<BillingSaasInvoiceHistoryCard invoices={[]} isError />);
    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.unavailable),
    ).toBeInTheDocument();
  });

  it("does not list open invoices even if they leak into props", () => {
    render(
      <BillingSaasInvoiceHistoryCard
        invoices={[
          {
            ...PAID,
            id: "inv-open",
            status: "open" as BillingSaasInvoice["status"],
          },
          PAID,
        ]}
      />,
    );

    expect(screen.getAllByText(formatBillingPeriodKey("2026-07"))).toHaveLength(
      1,
    );
    expect(
      screen.queryByText(billingCopy.arrears.pendingPayment),
    ).not.toBeInTheDocument();
  });

  it("keeps Tlamx disclaimer and does not talk CFDI/flete in the table", () => {
    render(<BillingSaasInvoiceHistoryCard invoices={[PAID]} />);

    expect(
      screen.getByText(billingCopy.saasInvoiceHistory.footer),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CFDI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pagar ahora/)).not.toBeInTheDocument();
  });
});
