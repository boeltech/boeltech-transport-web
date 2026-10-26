import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { FinanceSummary, PeriodFinancials } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { FinancePulseCards } from "./FinancePulseCards";

const summary: FinanceSummary = {
  totalReceivable: 50_000,
  collectedThisMonth: 12_000,
  totalOverdue: 8_000,
  expensesThisMonth: 3_000,
  invoicesByStatus: {
    draft: 0,
    stamped: 1,
    cancellationPending: 0,
    cancelled: 0,
  },
};

const pulseMonth: PeriodFinancials = {
  period: "2026-10",
  actualRevenue: 100_000,
  actualCost: 40_000,
  actualMargin: 60_000,
  operationalCost: 55_000,
  operationalMargin: 45_000,
  periodPersonnelCost: 0,
  tripCount: 10,
  incompleteTripCount: 0,
  tripsWithPendingExpenses: 0,
  provisional: false,
};

describe("FinancePulseCards", () => {
  it("muestra Ingreso, Margen operativo, Por cobrar, Vencido, línea no-P&L y CTA", () => {
    renderWithTheme(
      <FinancePulseCards
        summary={summary}
        pulseMonth={pulseMonth}
        analysisHref="/finance/analysis?view=performance"
        periodLabel="oct 2026"
      />,
    );

    const section = screen.getByRole("region", {
      name: financeCopy.pulse.ariaLabel,
    });
    expect(section).toBeInTheDocument();

    expect(screen.getByText(financeCopy.pulse.revenue.title)).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.pulse.operationalMargin.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.pulse.receivable.title),
    ).toBeInTheDocument();
    expect(screen.getByText(financeCopy.pulse.overdue.title)).toBeInTheDocument();

    expect(screen.getByText(financeCopy.pulse.basisLine)).toBeInTheDocument();
    expect(financeCopy.pulse.basisLine).toMatch(/base operativa/i);
    expect(financeCopy.pulse.basisLine).toMatch(/no es P&L/i);

    const cta = screen.getByRole("link", {
      name: financeCopy.pulse.ctaMonthOverMonth,
    });
    expect(cta).toHaveAttribute(
      "href",
      "/finance/analysis?view=performance",
    );

    expect(screen.getByText(/Mes en curso · oct 2026/i)).toBeInTheDocument();
  });

  it("Por cobrar y Vencido enlazan a Cobros cuando hay href (CA 4)", () => {
    renderWithTheme(
      <FinancePulseCards
        summary={summary}
        pulseMonth={pulseMonth}
        analysisHref="/finance/analysis?view=performance"
        receivableHref="/finance/cobros"
        overdueHref="/finance/cobros"
      />,
    );

    expect(
      screen.getByRole("link", {
        name: financeCopy.pulse.receivableLinkAria,
      }),
    ).toHaveAttribute("href", "/finance/cobros");
    expect(
      screen.getByRole("link", {
        name: financeCopy.pulse.overdueLinkAria,
      }),
    ).toHaveAttribute("href", "/finance/cobros");
  });

  it("no muestra Cobrado en el Pulse (opcional omitido para no saturar)", () => {
    renderWithTheme(
      <FinancePulseCards
        summary={summary}
        pulseMonth={pulseMonth}
        analysisHref="/finance/analysis?view=performance"
      />,
    );
    expect(
      screen.queryByText(financeCopy.kpis.collectedThisMonth.title),
    ).not.toBeInTheDocument();
  });
});
