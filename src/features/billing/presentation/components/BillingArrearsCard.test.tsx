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
});
