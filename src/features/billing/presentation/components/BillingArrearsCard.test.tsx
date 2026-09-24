import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BillingArrears } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { formatBillingPeriodKey } from "../utils/billingFormatters";
import { BillingArrearsCard } from "./BillingArrearsCard";

const ARREARS: BillingArrears = {
  currency: "MXN",
  openCount: 1,
  totalOpenCents: 215424,
  oldestDueDate: "2026-08-15T05:59:59.999Z",
  maxDaysOverdue: 0,
  invoices: [
    {
      id: "inv-july",
      periodKey: "2026-07",
      status: "open",
      totalCents: 215424,
      amountDueCents: 215424,
      dueDate: "2026-08-15T05:59:59.999Z",
      daysOverdue: 0,
      issuedAt: "2026-08-01T16:00:00.000Z",
    },
  ],
};

describe("BillingArrearsCard", () => {
  it("shows total open amount, July period and Por pagar (not overdue)", () => {
    render(<BillingArrearsCard data={ARREARS} />);

    expect(screen.getByText(billingCopy.arrears.title)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.arrears.totalLabel)).toBeInTheDocument();
    expect(screen.getAllByText(/\$2,154\.24/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vence el/)).toBeInTheDocument();
    expect(screen.getByText(/Por pagar/)).toBeInTheDocument();
    expect(screen.queryByText(/Al corriente/)).not.toBeInTheDocument();
    expect(screen.queryByText(billingCopy.arrears.payNow)).not.toBeInTheDocument();
  });

  it("shows overdue wording when daysOverdue > 0", () => {
    render(
      <BillingArrearsCard
        data={{
          ...ARREARS,
          maxDaysOverdue: 3,
          invoices: [{ ...ARREARS.invoices[0], daysOverdue: 3 }],
        }}
      />,
    );

    expect(screen.getByText(/Venció el/)).toBeInTheDocument();
    expect(screen.getByText(/3 días de atraso/)).toBeInTheDocument();
    expect(screen.queryByText(/Por pagar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Al corriente/)).not.toBeInTheDocument();
  });

  it("shows loading copy while resolving", () => {
    render(<BillingArrearsCard data={ARREARS} isLoading />);
    expect(screen.getByText(billingCopy.arrears.loading)).toBeInTheDocument();
  });

  it("shows Pagar ahora when Stripe pay is allowed and default PM exists", async () => {
    const user = userEvent.setup();
    const onPayInvoice = vi.fn().mockResolvedValue(undefined);

    render(
      <BillingArrearsCard
        data={ARREARS}
        canPayWithStripe
        hasDefaultPaymentMethod
        onPayInvoice={onPayInvoice}
      />,
    );

    const payBtn = screen.getByRole("button", {
      name: billingCopy.arrears.payNow,
    });
    await user.click(payBtn);
    expect(onPayInvoice).toHaveBeenCalledWith("inv-july");
  });

  it("hides Pagar ahora without default PM and shows hint", () => {
    render(
      <BillingArrearsCard
        data={ARREARS}
        canPayWithStripe
        hasDefaultPaymentMethod={false}
        onPayInvoice={vi.fn()}
      />,
    );

    expect(screen.queryByText(billingCopy.arrears.payNow)).not.toBeInTheDocument();
    expect(screen.getByText(billingCopy.arrears.payNeedsCard)).toBeInTheDocument();
  });

  it("uses SaaS subscription copy, not CFDI freight wording", () => {
    render(<BillingArrearsCard data={ARREARS} />);
    expect(screen.getByText(/suscripción Boeltech/i)).toBeInTheDocument();
    expect(screen.getByText(/facturas CFDI de flete/i)).toBeInTheDocument();
  });

  it("shows grace deadline orientation when label is provided", () => {
    render(
      <BillingArrearsCard
        data={ARREARS}
        graceDeadlineLabel="15 sep 2026"
      />,
    );

    expect(
      screen.getByText(billingCopy.arrears.graceOperate("15 sep 2026")),
    ).toBeInTheDocument();
    expect(screen.getByText(/seguir operando y facturando/i)).toBeInTheDocument();
    expect(screen.getByText(/antes del 15 sep 2026/)).toBeInTheDocument();
  });

  it("omits grace line when deadline label is empty", () => {
    render(<BillingArrearsCard data={ARREARS} graceDeadlineLabel="" />);
    expect(
      screen.queryByText(/Regulariza el pago antes del/),
    ).not.toBeInTheDocument();
  });

  it("shows persistent failed auto-charge alert and keeps Pagar ahora", () => {
    render(
      <BillingArrearsCard
        data={{
          ...ARREARS,
          invoices: [
            {
              ...ARREARS.invoices[0],
              lastAutoCharge: {
                outcome: "failed",
                skipReason: null,
                failureCode: "card_declined",
                createdAt: "2026-09-23T12:00:00.000Z",
              },
            },
          ],
        }}
        canPayWithStripe
        hasDefaultPaymentMethod
        onPayInvoice={vi.fn()}
      />,
    );

    expect(
      screen.getByText(billingCopy.arrears.autoChargeFailed),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: billingCopy.arrears.payNow }),
    ).toBeInTheDocument();
  });

  it("shows persistent 3DS alert without inventing a new status", () => {
    render(
      <BillingArrearsCard
        data={{
          ...ARREARS,
          invoices: [
            {
              ...ARREARS.invoices[0],
              lastAutoCharge: {
                outcome: "requires_action",
                skipReason: null,
                failureCode: null,
                createdAt: "2026-09-23T12:00:00.000Z",
              },
            },
          ],
        }}
        canPayWithStripe
        hasDefaultPaymentMethod
        onPayInvoice={vi.fn()}
      />,
    );

    expect(
      screen.getByText(billingCopy.arrears.autoChargeRequiresAction),
    ).toBeInTheDocument();
    expect(screen.queryByText(/3DS/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: billingCopy.arrears.payNow }),
    ).toBeInTheDocument();
  });
});
