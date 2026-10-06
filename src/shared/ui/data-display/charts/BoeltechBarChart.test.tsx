import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoeltechBarChart } from "./BoeltechBarChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: ({
    width,
    tickFormatter,
  }: {
    width: number;
    tickFormatter?: (value: number) => string;
  }) => (
    <span data-testid="y-axis" data-width={width}>
      {tickFormatter ? tickFormatter(600_000) : "600000"}
    </span>
  ),
  Tooltip: () => null,
}));

const series = [{ dataKey: "revenue", label: "Ingreso", token: "chart-1" as const }];

describe("BoeltechBarChart", () => {
  it("keeps the raw 48px Y axis by default", () => {
    render(<BoeltechBarChart data={[{ label: "ene", revenue: 600_000 }]} series={series} />);

    const axis = screen.getByTestId("y-axis");
    expect(axis).toHaveAttribute("data-width", "48");
    expect(axis).toHaveTextContent("600000");
  });

  it("applies the Y axis tick formatter and width", () => {
    render(
      <BoeltechBarChart
        data={[{ label: "ene", revenue: 600_000 }]}
        series={series}
        yAxisTickFormatter={(value) => `$${value / 1000} k`}
        yAxisWidth={64}
      />,
    );

    const axis = screen.getByTestId("y-axis");
    expect(axis).toHaveAttribute("data-width", "64");
    expect(axis).toHaveTextContent("$600 k");
  });
});
