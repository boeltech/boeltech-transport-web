import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoeltechComboChart } from "./BoeltechComboChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe("BoeltechComboChart", () => {
  it("renders chart and legend with mixed bar and line series", () => {
    render(
      <BoeltechComboChart
        data={[
          { label: "Ene", revenue: 1000, actual: 800, marginPct: 20 },
          { label: "Feb", revenue: 1200, actual: 900, marginPct: 25 },
        ]}
        series={[
          {
            dataKey: "revenue",
            label: "Ingreso",
            token: "success",
            type: "bar",
          },
          {
            dataKey: "actual",
            label: "Gasto",
            token: "destructive",
            type: "bar",
          },
          {
            dataKey: "marginPct",
            label: "Margen %",
            token: "info",
            type: "line",
            yAxisId: "right",
          },
        ]}
        valueFormatter={(v) => `$${v}`}
      />,
    );

    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("Gasto")).toBeInTheDocument();
    expect(screen.getByText("Margen %")).toBeInTheDocument();
  });

  it("hides legend when showLegend is false", () => {
    render(
      <BoeltechComboChart
        data={[{ label: "Ene", revenue: 1000 }]}
        series={[
          {
            dataKey: "revenue",
            label: "Ingreso",
            token: "success",
            type: "bar",
          },
        ]}
        showLegend={false}
      />,
    );

    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.queryByText("Ingreso")).not.toBeInTheDocument();
  });
});
