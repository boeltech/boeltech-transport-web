import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { OperatingResult } from "@features/finance/application";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import { financeCopy } from "../copy";
import {
  OperatingResultCascade,
  OperatingResultSection,
} from "./OperatingResultCascade";

const monthlyQuery = vi.hoisted(() => ({
  data: undefined as MonthlyPerformance | undefined,
  isLoading: false,
  isPlaceholderData: false,
  isError: false,
  refetch: vi.fn(),
  lastMonths: 0,
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useMonthlyPerformance: (months: number) => {
      monthlyQuery.lastMonths = months;
      return {
        data: monthlyQuery.data,
        isLoading: monthlyQuery.isLoading,
        isPlaceholderData: monthlyQuery.isPlaceholderData,
        isError: monthlyQuery.isError,
        refetch: monthlyQuery.refetch,
      };
    },
  };
});

const copy = financeCopy.operatingResult;

const RESULT: OperatingResult = {
  revenue: 10000,
  tripExpenses: 3000,
  tripCommission: 1000,
  operationalCost: 4000,
  operationalMargin: 6000,
  personnelCost: 2500,
  afterPersonnel: 3500,
  provisional: false,
  months: ["2026-08", "2026-09"],
};

function rowOf(label: string): HTMLElement {
  const row = screen.getByText(label).closest("[data-row]");
  if (!(row instanceof HTMLElement)) throw new Error(`row ${label} not found`);
  return row;
}

function render(ui: React.ReactElement) {
  return renderWithTheme(ui, { route: ["/finance/analysis"], resolvedTheme: "light" });
}

describe("OperatingResultCascade", () => {
  it("renders the cascade in order with two totals and the cost-group label", () => {
    render(<OperatingResultCascade result={RESULT} />);

    expect(
      screen.getByRole("region", { name: copy.titleWithPeriod("ago–sep 2026") }),
    ).toBeInTheDocument();
    const rows = Array.from(document.querySelectorAll("[data-row]")).map(
      (row) => row.getAttribute("data-row"),
    );
    expect(rows).toEqual([
      "revenue",
      "tripExpenses",
      "tripCommission",
      "operationalCostGroup",
      "operationalMargin",
      "personnelCost",
      "afterPersonnel",
    ]);

    expect(within(rowOf(copy.rows.revenue)).getByText("$10,000.00")).toBeInTheDocument();
    expect(within(rowOf(copy.rows.tripExpenses)).getByText("−")).toBeInTheDocument();
    expect(within(rowOf(copy.rows.tripCommission)).getByText("$1,000.00")).toBeInTheDocument();
    expect(
      within(rowOf(copy.rows.operationalCostGroup)).getByText("$4,000.00"),
    ).toBeInTheDocument();
    expect(
      within(rowOf(copy.rows.operationalMargin)).getByText("$6,000.00"),
    ).toBeInTheDocument();
    expect(
      within(rowOf(copy.rows.afterPersonnel)).getByText("$3,500.00"),
    ).toBeInTheDocument();
  });

  it("uses CardContent width for cascade and alerts (no max-w-xl bottleneck)", () => {
    render(
      <OperatingResultCascade
        result={{ ...RESULT, provisional: true }}
        partialMonths
        periodLabel="10–20 sep 2026 (días)"
        asOf="06 oct"
      />,
    );
    const list = screen.getByLabelText(copy.ariaLabel);
    expect(list.tagName).toBe("DL");
    expect(list.className).toMatch(/\bw-full\b/);
    expect(list.className).not.toMatch(/max-w-xl/);
    for (const status of screen.getAllByRole("status")) {
      expect(status.className).toMatch(/\bw-full\b/);
      expect(status.className).not.toMatch(/max-w-xl/);
    }
    const amount = within(rowOf(copy.rows.revenue)).getByText("$10,000.00");
    expect(amount.className).toMatch(/text-right/);
    expect(amount.className).toMatch(/shrink-0/);
  });

  it("the cost-group label is a subtotal, not a third subtraction", () => {
    render(<OperatingResultCascade result={RESULT} />);
    const group = rowOf(copy.rows.operationalCostGroup);
    expect(within(group).queryByText("−")).not.toBeInTheDocument();
    expect(within(group).queryByText("=")).not.toBeInTheDocument();
    expect(within(rowOf(copy.rows.operationalMargin)).getByText("=")).toBeInTheDocument();
  });

  it("explains each row on hover via tooltip", async () => {
    const user = userEvent.setup();
    render(<OperatingResultCascade result={RESULT} />);
    await user.hover(
      screen.getByRole("button", { name: copy.hintAriaLabel(copy.rows.tripCommission) }),
    );
    expect(
      (await screen.findAllByText(copy.hints.tripCommission)).length,
    ).toBeGreaterThan(0);
  });

  it("omits personnel rows when there is no personnel data", () => {
    render(
      <OperatingResultCascade
        result={{ ...RESULT, personnelCost: null, afterPersonnel: null }}
      />,
    );
    expect(screen.queryByText(copy.rows.personnelCost)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.rows.afterPersonnel)).not.toBeInTheDocument();
  });

  it("shows partial-months alert, provisional note with cut-off and truncated note", () => {
    render(
      <OperatingResultCascade
        result={{ ...RESULT, provisional: true }}
        partialMonths
        periodLabel="10–20 sep 2026 (días)"
        asOf="06 oct"
        truncatedMonths={24}
      />,
    );
    const statuses = screen.getAllByRole("status");
    expect(statuses[0]).toHaveTextContent(
      copy.partialMonthsAlert("ago–sep 2026", 2, "10–20 sep 2026 (días)"),
    );
    expect(statuses[1]).toHaveTextContent(copy.provisionalNote("06 oct"));
    expect(statuses[1]).toHaveTextContent(/margen suele bajar/i);
    expect(screen.getByText(copy.truncatedNote(24))).toBeInTheDocument();
  });

  it("marks a single current month as «(en curso)» and offers «Ver mes anterior»", async () => {
    const user = userEvent.setup();
    const onViewPreviousMonth = vi.fn();
    render(
      <OperatingResultCascade
        result={{ ...RESULT, provisional: true, months: ["2026-10"] }}
        currentMonth="2026-10"
        asOf="26 oct"
        onViewPreviousMonth={onViewPreviousMonth}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: copy.titleWithPeriod(`octubre 2026 ${copy.inProgressSuffix}`),
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: financeCopy.analysisPeriod.viewPreviousMonth }),
    );
    expect(onViewPreviousMonth).toHaveBeenCalledTimes(1);
  });

  it("mentions salida programada and the liquidation period in the description", () => {
    expect(copy.description).toMatch(/salida programada/i);
    expect(copy.description).toMatch(/periodo de liquidación/i);
    expect(copy.hints.tripExpenses).toMatch(/mes de salida/i);
  });

  it("renders nothing without result and not loading", () => {
    const { container } = render(<OperatingResultCascade result={null} />);
    expect(container.querySelector("[data-row]")).toBeNull();
    expect(screen.queryByText(new RegExp(copy.title))).not.toBeInTheDocument();
  });
});

function period(p: string, split = true): PeriodFinancials {
  return {
    period: p,
    actualRevenue: 1000,
    actualCost: 400,
    actualMargin: 600,
    operationalCost: 400,
    operationalMargin: 600,
    tripExpensesCost: split ? 300 : undefined,
    tripCommissionCost: split ? 100 : undefined,
    periodPersonnelCost: 100,
    tripCount: 1,
    incompleteTripCount: 0,
    tripsWithPendingExpenses: 0,
    provisional: false,
  };
}

describe("OperatingResultSection", () => {
  beforeEach(() => {
    monthlyQuery.isLoading = false;
    monthlyQuery.isPlaceholderData = false;
    monthlyQuery.isError = false;
    monthlyQuery.refetch.mockClear();
    monthlyQuery.data = {
      periods: ["2026-08", "2026-09", "2026-10"],
      current: [period("2026-08"), period("2026-09"), period("2026-10")],
      previous: [],
      marginBasis: "operational",
    };
  });

  const hubPeriod = { from: "2026-08-01", to: "2026-09-30", choice: "custom" as const };

  it("sums the hub period months from the monthly series", () => {
    render(<OperatingResultSection period={hubPeriod} today="2026-10-26" />);
    expect(monthlyQuery.lastMonths).toBe(3);
    expect(within(rowOf(copy.rows.revenue)).getByText("$2,000.00")).toBeInTheDocument();
    expect(
      within(rowOf(copy.rows.afterPersonnel)).getByText("$1,000.00"),
    ).toBeInTheDocument();
  });

  it("�Este mes� provisional: cut-off day and �Ver mes anterior� moves the hub period", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    monthlyQuery.data = {
      ...monthlyQuery.data!,
      current: [period("2026-08"), period("2026-09"), { ...period("2026-10"), provisional: true }],
    };
    render(
      <OperatingResultSection
        period={{ from: "2026-10-01", to: "2026-10-31", choice: "this_month" }}
        today="2026-10-26"
        onRangeChange={onRangeChange}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: copy.titleWithPeriod(`octubre 2026 ${copy.inProgressSuffix}`),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.provisionalNote("26 oct"))).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: financeCopy.analysisPeriod.viewPreviousMonth }),
    );
    expect(onRangeChange).toHaveBeenCalledWith({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("renders nothing on first load (basis still unknown)", () => {
    monthlyQuery.isLoading = true;
    monthlyQuery.data = undefined;
    render(<OperatingResultSection period={hubPeriod} today="2026-10-26" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("is hidden with margin_basis trip_expenses", () => {
    monthlyQuery.data = { ...monthlyQuery.data!, marginBasis: "trip_expenses" };
    render(<OperatingResultSection period={hubPeriod} today="2026-10-26" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("is hidden when the API lacks the expense/commission split", () => {
    monthlyQuery.data = {
      ...monthlyQuery.data!,
      current: [period("2026-08", false), period("2026-09", false), period("2026-10", false)],
    };
    render(<OperatingResultSection period={hubPeriod} today="2026-10-26" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("error shows DetailAlertCard with Reintentar", async () => {
    const user = userEvent.setup();
    monthlyQuery.isError = true;
    render(<OperatingResultSection period={hubPeriod} today="2026-10-26" />);
    expect(screen.getByText(copy.error.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.error.retry }));
    expect(monthlyQuery.refetch).toHaveBeenCalled();
  });
});
