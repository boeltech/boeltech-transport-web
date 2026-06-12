/**
 * BoeltechDonutChart — donut/pie con label central opcional.
 */

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartContainer } from "./ChartContainer";
import { ChartLegend } from "./ChartLegend";
import { createChartTooltip } from "./createChartTooltip";
import { chartColor, type ChartSeries } from "./chartTokens";

export interface BoeltechDonutChartProps {
  /** Cada fila debe incluir `value` numérico y opcionalmente `label` para tooltip. */
  data: Record<string, string | number>[];
  series: ChartSeries[];
  valueKey?: string;
  nameKey?: string;
  height?: number;
  centerLabel?: ReactNode;
  showLegend?: boolean;
  valueFormatter?: (value: ValueType, dataKey: string) => string;
}

export function BoeltechDonutChart({
  data,
  series,
  valueKey = "value",
  nameKey = "label",
  height,
  centerLabel,
  showLegend = true,
  valueFormatter,
}: BoeltechDonutChartProps) {
  const slices = data.map((row, index) => {
    const token = series[index]?.token ?? series[0]?.token ?? "chart-1";
    const label = String(row[nameKey] ?? series[index]?.label ?? index);
    return {
      ...row,
      name: label,
      fill: chartColor(token),
    };
  });

  return (
    <div className="space-y-3">
      <div className="relative isolate">
        <ChartContainer height={height ?? 260} className="relative z-10">
          <PieChart>
            <Tooltip
              content={createChartTooltip({ series, valueFormatter })}
              wrapperStyle={{ zIndex: 50 }}
            />
            <Pie
              data={slices}
              dataKey={valueKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div className="text-center">{centerLabel}</div>
          </div>
        ) : null}
      </div>
      {showLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
}
