import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FinanceSummary } from "@features/finance/domain";
import { DashboardInvoicesMonthWidget } from "./DashboardInvoicesMonthWidget";
import { dashboardCopy } from "../copy/dashboardCopy";

function summary(
  overrides: Partial<FinanceSummary["invoicesByStatus"]> = {},
): FinanceSummary {
  return {
    totalReceivable: 0,
    collectedThisMonth: 0,
    totalOverdue: 0,
    expensesThisMonth: 0,
    invoicesByStatus: {
      draft: 0,
      stamped: 0,
      cancellationPending: 0,
      cancelled: 0,
      ...overrides,
    },
  };
}

describe("DashboardInvoicesMonthWidget", () => {
  it("shows stamped vs pending and navigates to invoices", async () => {
    const user = userEvent.setup();
    const onOpenInvoices = vi.fn();

    render(
      <DashboardInvoicesMonthWidget
        financeSummary={summary({ stamped: 12, draft: 4, cancelled: 1 })}
        isLoading={false}
        onOpenInvoices={onOpenInvoices}
      />,
    );

    expect(screen.getByText(dashboardCopy.invoicesMonth.stamped)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(dashboardCopy.invoicesMonth.pending)).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${dashboardCopy.invoicesMonth.cancelled}: 1`,
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.invoicesMonth.openAriaLabel,
      }),
    );
    expect(onOpenInvoices).toHaveBeenCalledOnce();
  });

  it("shows empty state when all counts are zero", () => {
    render(
      <DashboardInvoicesMonthWidget
        financeSummary={summary()}
        isLoading={false}
        onOpenInvoices={vi.fn()}
      />,
    );

    expect(
      screen.getByText(dashboardCopy.invoicesMonth.emptyTitle),
    ).toBeInTheDocument();
  });
});
