/**
 * ChartTooltip — content custom para Tooltip de Recharts con tokens DS.
 */

import type { TooltipProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { cn } from "@shared/lib/utils/cn";
import { chartColor, type ChartSeries } from "./chartTokens";

export interface ChartTooltipContentProps
  extends TooltipProps<ValueType, NameType> {
  series?: ChartSeries[];
  valueFormatter?: (value: ValueType, dataKey: string) => string;
}

function formatDefaultValue(value: ValueType): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    return value.toLocaleString("es-MX");
  }
  return String(value);
}

function findSeriesForTooltipEntry(
  entry: Payload<ValueType, NameType>,
  series?: ChartSeries[],
): ChartSeries | undefined {
  if (!series?.length) return undefined;

  const entryName = String(entry.name ?? entry.payload?.name ?? "");
  if (entryName) {
    const byLabel = series.find((item) => item.label === entryName);
    if (byLabel) return byLabel;
  }

  const dataKey = String(entry.dataKey ?? entry.name ?? "");
  const byDataKey = series.filter((item) => item.dataKey === dataKey);
  if (byDataKey.length === 1) return byDataKey[0];

  return undefined;
}

function resolveLabel(
  entry: Payload<ValueType, NameType>,
  series?: ChartSeries[],
): string {
  const match = findSeriesForTooltipEntry(entry, series);
  if (match) return match.label;

  const name = String(entry.name ?? entry.payload?.name ?? "");
  if (name) return name;

  return String(entry.dataKey ?? "—");
}

function resolveColor(
  entry: Payload<ValueType, NameType>,
  series?: ChartSeries[],
): string {
  if (entry.color) return String(entry.color);

  const fill = entry.payload?.fill;
  if (typeof fill === "string" && fill) return fill;

  const match = findSeriesForTooltipEntry(entry, series);
  if (match) return chartColor(match.token);

  return chartColor("chart-1");
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  series,
  valueFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "relative z-50 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md",
        "text-xs",
      )}
    >
      {label != null && label !== "" ? (
        <p className="mb-1.5 font-medium">{String(label)}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((entry, index) => {
          const dataKey = String(entry.dataKey ?? entry.name ?? index);
          const formatted = valueFormatter
            ? valueFormatter(entry.value as ValueType, dataKey)
            : formatDefaultValue(entry.value as ValueType);

          return (
            <li key={`${dataKey}-${index}`} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: resolveColor(entry, series) }}
              />
              <span className="text-muted-foreground">
                {resolveLabel(entry, series)}:
              </span>
              <span className="font-medium tabular-nums">{formatted}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface ChartTooltipProps {
  series?: ChartSeries[];
  valueFormatter?: (value: ValueType, dataKey: string) => string;
}
