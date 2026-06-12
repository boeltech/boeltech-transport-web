/**
 * BoeltechBarChart — barras agrupadas o apiladas con tokens DS.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartContainer } from "./ChartContainer";
import { ChartLegend } from "./ChartLegend";
import { createChartTooltip } from "./createChartTooltip";
import {
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
  CHART_GRID,
  chartColor,
  type ChartSeries,
} from "./chartTokens";

export interface BoeltechBarChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
}

export function BoeltechBarChart({
  data,
  series,
  xAxisKey = "label",
  height,
  stacked = false,
  showLegend = true,
  valueFormatter,
}: BoeltechBarChartProps) {
  return (
    <div className="space-y-3">
      <ChartContainer height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            axisLine={CHART_AXIS_LINE}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            width={48}
          />
          <Tooltip
            content={createChartTooltip({ series, valueFormatter })}
            cursor={{ fill: "var(--muted)" }}
          />
          {series.map((item) => (
            <Bar
              key={item.dataKey}
              dataKey={item.dataKey}
              name={item.label}
              fill={chartColor(item.token)}
              stackId={stacked ? "stack" : undefined}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
      {showLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
}
