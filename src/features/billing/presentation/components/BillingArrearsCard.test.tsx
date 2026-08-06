import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
