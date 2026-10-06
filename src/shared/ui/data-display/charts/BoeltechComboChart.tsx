import type { ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { cn } from "@shared/lib/utils/cn";
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

export type ComboChartSeries = ChartSeries & {
  type: "bar" | "line";
  yAxisId?: "left" | "right";
  /** Atenúa la serie (p. ej. periodo de comparación). Default: 1. */
  fillOpacity?: number;
  /** Solo líneas: patrón SVG de trazo, p. ej. `"6 4"`. */
  strokeDasharray?: string;
};

export type ComboChartRow = Record<string, string | number | null>;

export interface ComboChartTooltipArgs {
  label: string;
  row: ComboChartRow;
}

export interface BoeltechComboChartProps {
  data: ComboChartRow[];
  series: ComboChartSeries[];
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
  percentFormatter?: (value: ValueType) => string;
  /** Formato de ticks del eje izquierdo (montos compactos, %, …). */
  yAxisTickFormatter?: (value: number) => string;
  /** Ancho del eje izquierdo; igualarlo alinea gráficas apiladas. Default: 48. */
  yAxisWidth?: number;
  /** Sincroniza el cursor del tooltip entre gráficas con el mismo id. */
  syncId?: string;
  /** Contenido propio del tooltip a partir de la fila completa del punto. */
  renderTooltip?: (args: ComboChartTooltipArgs) => ReactNode;
  /** Etiqueta del tick X; `index` = posición entre los ticks visibles. */
  xAxisTickFormatter?: (value: string, index: number) => string;
  /**
   * Activa la selección de ticks X por ancho medido: si no caben todos, el último
   * valor y estos se muestran siempre. Sin la prop, Recharts decide.
   */
  xAxisPriorityValues?: readonly string[];
}

const RIGHT_AXIS_WIDTH = 40;
const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

function createRowTooltip(render: (args: ComboChartTooltipArgs) => ReactNode) {
  return function ComboRowTooltip({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) {
    const row = payload?.[0]?.payload as ComboChartRow | undefined;
    if (!active || !row) return null;
    return (
      <div
        className={cn(
          "relative z-50 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md",
          "text-xs",
        )}
      >
        {render({ label: String(label ?? ""), row })}
      </div>
    );
  };
}

export function BoeltechComboChart({
  data,
  series,
  xAxisKey = "label",
  height,
  showLegend = true,
  valueFormatter,
  percentFormatter = (v) => `${Number(v).toFixed(1)}%`,
  yAxisTickFormatter,
  yAxisWidth = 48,
  syncId,
  renderTooltip,
  xAxisTickFormatter,
  xAxisPriorityValues,
}: BoeltechComboChartProps) {
  const hasRightAxis = series.some((s) => s.yAxisId === "right");
  const xTicks = useFittedCategoryTicks({
    data,
    xAxisKey,
    tickFormatter: xAxisTickFormatter,
    priorityValues: xAxisPriorityValues,
    reservedWidth:
      yAxisWidth +
      (hasRightAxis ? RIGHT_AXIS_WIDTH : 0) +
      CHART_MARGIN.left +
      CHART_MARGIN.right,
  });

  return (
    <div className="space-y-3">
      <ChartContainer height={height} onResize={xTicks.onResize}>
        <ComposedChart data={data} syncId={syncId} margin={CHART_MARGIN}>
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
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={CHART_AXIS_TICK}
            width={yAxisWidth}
            tickFormatter={yAxisTickFormatter}
          />
          {hasRightAxis ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={CHART_AXIS_TICK}
              width={RIGHT_AXIS_WIDTH}
              tickFormatter={(v) => `${v}%`}
            />
          ) : null}
          <Tooltip
            content={
              renderTooltip
                ? createRowTooltip(renderTooltip)
                : createChartTooltip({
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
                  })
            }
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
                fillOpacity={item.fillOpacity ?? 1}
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
                strokeOpacity={item.fillOpacity ?? 1}
                strokeDasharray={item.strokeDasharray}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: chartColor(item.token),
                  fillOpacity: item.fillOpacity ?? 1,
                  strokeWidth: 0,
                }}
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
