/**
 * BoeltechAreaChart — áreas con fillOpacity suave y tokens DS.
 */

import {
  Area,
  AreaChart,
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

export interface BoeltechAreaChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
}

export function BoeltechAreaChart({
  data,
  series,
  xAxisKey = "label",
  height,
  showLegend = true,
  valueFormatter,
}: BoeltechAreaChartProps) {
  return (
    <div className="space-y-3">
      <ChartContainer height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            cursor={{ stroke: "var(--border)" }}
          />
          {series.map((item) => (
            <Area
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.label}
              stroke={chartColor(item.token)}
              fill={chartColor(item.token)}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
      {showLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
}
