import { useMemo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { chartColor, type ChartToken } from "./chartTokens";

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  token?: ChartToken;
}

export interface BoeltechBarListProps {
  items: BarListItem[];
  valueFormatter?: (value: number) => string;
  onItemClick?: (key: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function BoeltechBarList({
  items,
  valueFormatter = (n) => String(n),
  onItemClick,
  className,
  "aria-label": ariaLabel,
}: BoeltechBarListProps) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.value - a.value),
    [items],
  );
  const max = useMemo(
    () => Math.max(...sorted.map((i) => i.value), 1),
    [sorted],
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sin datos para ranking.
      </p>
    );
  }

  return (
    <ul
      className={cn("space-y-3", className)}
      role="list"
      aria-label={ariaLabel ?? "Ranking"}
    >
      {sorted.map((item) => {
        const pct = (item.value / max) * 100;
        const token = item.token ?? "chart-1";
        const content = (
          <>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: chartColor(token),
                }}
              />
            </div>
          </>
        );

        if (onItemClick) {
          return (
            <li key={item.key}>
              <button
                type="button"
                className="w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50"
                onClick={() => onItemClick(item.key)}
              >
                {content}
              </button>
            </li>
          );
        }

        return <li key={item.key}>{content}</li>;
      })}
    </ul>
  );
}
