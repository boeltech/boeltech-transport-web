import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import { ProfitabilityCharts } from "./ProfitabilityCharts";

function ChartStub({
  testId,
  data,
}: {
  testId: string;
  data: Array<Record<string, string | number | null>>;
}) {
  return (
    <div
      data-testid={testId}
      data-labels={data.map((row) => row.label).join(",")}
    />
  );
}

vi.mock("@shared/ui/data-display", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/ui/data-display")>()),
  BoeltechComboChart: ({
    data,
  }: {
    data: Array<Record<string, string | number | null>>;
  }) => <ChartStub testId="combo-chart" data={data} />,
  BoeltechLineChart: ({
    data,
  }: {
    data: Array<Record<string, string | number | null>>;
  }) => <ChartStub testId="line-chart" data={data} />,
}));

function monthRow(
  key: string,
  totalRevenue: number,
  blendedMarginPct: number | null,
): ProfitabilityAggregateItem {
  return {
    key,
    label: key,
    tripCount: 1,
    totalRevenue,
    totalActual: totalRevenue / 2,
    blendedMargin: totalRevenue / 2,
    blendedMarginPct,
  };
}

const revenueOrdered = (marginPct: number | null) => [
  monthRow("2026-01", 100, marginPct),
  monthRow("2026-03", 200, marginPct),
  monthRow("2025-12", 300, marginPct),
  monthRow("2026-02", 400, marginPct),
];

const chronologicalLabels = "dic 2025,ene 2026,feb 2026,mar 2026";

describe("ProfitabilityCharts", () => {
  it("plots the monthly combo chart chronologically, not in API revenue order", () => {
    render(
      <ProfitabilityCharts scope="operational" monthAggregate={revenueOrdered(25)} />,
    );
    expect(screen.getByTestId("combo-chart")).toHaveAttribute(
      "data-labels",
      chronologicalLabels,
    );
  });

  it("plots the line chart chronologically when there is no margin to show", () => {
    render(
      <ProfitabilityCharts scope="pipeline" monthAggregate={revenueOrdered(null)} />,
    );
    expect(screen.getByTestId("line-chart")).toHaveAttribute(
      "data-labels",
      chronologicalLabels,
    );
  });
});
