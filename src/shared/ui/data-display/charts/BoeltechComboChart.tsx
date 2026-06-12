import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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

export type ComboChartSeries = ChartSeries & {
  type: "bar" | "line";
  yAxisId?: "left" | "right";
};

export interface BoeltechComboChartProps {
  data: Record<string, string | number>[];
  series: ComboChartSeries[];
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
  percentFormatter?: (value: ValueType) => string;
}

export function BoeltechComboChart({
  data,
  series,
  xAxisKey = "label",
  height,
  showLegend = true,
  valueFormatter,
  percentFormatter = (v) => `${Number(v).toFixed(1)}%`,
}: BoeltechComboChartProps) {
  const hasRightAxis = series.some((s) => s.yAxisId === "right");

  return (
    <div className="space-y-3">
      <ChartContainer height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: hasRightAxis ? 8 : 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            axisLine={CHART_AXIS_LINE}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            dy={8}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            width={48}
          />
          {hasRightAxis ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK}
              width={40}
              tickFormatter={(v) => `${v}%`}
            />
          ) : null}
          <Tooltip
            content={createChartTooltip({
              series,
              valueFormatter: (value, dataKey) => {
                const s = series.find((item) => item.dataKey === dataKey);
                if (s?.yAxisId === "right") {
                  return percentFormatter(value);
                }
                return valueFormatter
                  ? valueFormatter(value, dataKey)
                  : String(value);
              },
            })}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          {series.map((item) =>
            item.type === "bar" ? (
              <Bar
                key={item.dataKey}
                yAxisId={item.yAxisId ?? "left"}
                dataKey={item.dataKey}
                name={item.label}
                fill={chartColor(item.token)}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ) : (
              <Line
                key={item.dataKey}
                yAxisId={item.yAxisId ?? "left"}
                type="monotone"
                dataKey={item.dataKey}
                name={item.label}
                stroke={chartColor(item.token)}
                strokeWidth={2}
                dot={{ r: 3, fill: chartColor(item.token), strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ),
          )}
        </ComposedChart>
      </ChartContainer>
      {showLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
}
