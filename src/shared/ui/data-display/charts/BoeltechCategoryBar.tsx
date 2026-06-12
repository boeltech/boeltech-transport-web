import { useMemo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { chartColor, type ChartToken } from "./chartTokens";

export interface CategoryBarSegment {
  key: string;
  label: string;
  value: number;
  token: ChartToken;
}

export interface BoeltechCategoryBarProps {
  segments: CategoryBarSegment[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function BoeltechCategoryBar({
  segments,
  valueFormatter = (n) => String(n),
  showLegend = true,
  className,
  "aria-label": ariaLabel,
}: BoeltechCategoryBarProps) {
  const activeSegments = useMemo(
    () => segments.filter((s) => s.value > 0),
    [segments],
  );
  const total = useMemo(
    () => activeSegments.reduce((sum, s) => sum + s.value, 0),
    [activeSegments],
  );

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sin datos para mostrar composición.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={ariaLabel ?? "Composición por categoría"}
      >
        {activeSegments.map((segment) => (
          <div
            key={segment.key}
            className="h-full min-w-[2px] transition-all"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: chartColor(segment.token),
            }}
            title={`${segment.label}: ${valueFormatter(segment.value)}`}
          />
        ))}
      </div>
      {showLegend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs" role="list">
          {activeSegments.map((segment) => (
            <li key={segment.key} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: chartColor(segment.token) }}
                aria-hidden
              />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="font-medium tabular-nums text-foreground">
                {valueFormatter(segment.value)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
