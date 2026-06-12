/**
 * ChartLegend — leyenda compacta DS-aware (swatch + label en español).
 */

import { cn } from "@shared/lib/utils/cn";
import { chartColor, type ChartSeries } from "./chartTokens";

export interface ChartLegendProps {
  series: ChartSeries[];
  className?: string;
}

export function ChartLegend({ series, className }: ChartLegendProps) {
  if (!series.length) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
      aria-label="Leyenda del gráfico"
    >
      {series.map((item, index) => (
        <li
          key={`${item.dataKey}-${item.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: chartColor(item.token) }}
            aria-hidden
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
