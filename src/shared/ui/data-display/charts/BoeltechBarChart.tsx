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
import { useFittedCategoryTicks } from "./categoryAxisTicks";
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

const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

export interface BoeltechBarChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
  /** Formato de ticks del eje Y (montos compactos, %, …). */
  yAxisTickFormatter?: (value: number) => string;
  /** Ancho del eje Y; súbelo cuando los ticks formateados son largos. Default: 48. */
  yAxisWidth?: number;
  /** Etiqueta del tick X; `index` = posición entre los ticks visibles. */
  xAxisTickFormatter?: (value: string, index: number) => string;
  /**
   * Activa la selección de ticks X por ancho medido: si no caben todos, el último
   * valor y estos se muestran siempre. Sin la prop, Recharts decide.
   */
  xAxisPriorityValues?: readonly string[];
  /** Título del tooltip a partir del valor de la categoría X. */
  tooltipTitleFormatter?: (value: string) => string;
}

export function BoeltechBarChart({
  data,
  series,
  xAxisKey = "label",
  height,
  stacked = false,
  showLegend = true,
  valueFormatter,
  yAxisTickFormatter,
  yAxisWidth = 48,
  xAxisTickFormatter,
  xAxisPriorityValues,
  tooltipTitleFormatter,
}: BoeltechBarChartProps) {
  const xTicks = useFittedCategoryTicks({
    data,
    xAxisKey,
    tickFormatter: xAxisTickFormatter,
    priorityValues: xAxisPriorityValues,
    reservedWidth: yAxisWidth + CHART_MARGIN.left + CHART_MARGIN.right,
  });

  return (
    <div className="space-y-3">
      <ChartContainer height={height} onResize={xTicks.onResize}>
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            axisLine={CHART_AXIS_LINE}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            dy={8}
            ticks={xTicks.ticks}
            interval={xTicks.interval}
            tickFormatter={xAxisTickFormatter}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            width={yAxisWidth}
            tickFormatter={yAxisTickFormatter}
          />
          <Tooltip
            content={createChartTooltip({
              series,
              valueFormatter,
              titleFormatter: tooltipTitleFormatter,
            })}
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
