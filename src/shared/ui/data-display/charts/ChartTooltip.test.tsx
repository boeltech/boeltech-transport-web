import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartTooltipContent } from "./ChartTooltip";
import type { ChartSeries } from "./chartTokens";

const invoiceStatusSeries: ChartSeries[] = [
  { dataKey: "value", label: "Borrador", token: "neutral" },
  { dataKey: "value", label: "Timbrada", token: "chart-1" },
  { dataKey: "value", label: "Cancelación pendiente", token: "warning" },
  { dataKey: "value", label: "Cancelada", token: "destructive" },
];

describe("ChartTooltipContent", () => {
  it("matches donut slices by name when series share the same dataKey", () => {
    render(
      <ChartTooltipContent
        active
        payload={[
          {
            name: "Timbrada",
            dataKey: "value",
            value: 7,
            color: "hsl(var(--chart-1))",
            payload: {
              label: "Timbrada",
              value: 7,
              name: "Timbrada",
              fill: "hsl(var(--chart-1))",
            },
          },
        ]}
        series={invoiceStatusSeries}
      />,
    );

    expect(screen.getByText("Timbrada:")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("Borrador:")).not.toBeInTheDocument();
  });

  it("still resolves bar series by unique dataKey", () => {
    const barSeries: ChartSeries[] = [
      { dataKey: "collected", label: "Cobrado", token: "success" },
      { dataKey: "overdue", label: "Vencido", token: "destructive" },
    ];

    render(
      <ChartTooltipContent
        active
        payload={[
          {
            name: "overdue",
            dataKey: "overdue",
            value: 1200,
            color: "hsl(var(--destructive))",
          },
        ]}
        series={barSeries}
      />,
    );

    expect(screen.getByText("Vencido:")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });
});
