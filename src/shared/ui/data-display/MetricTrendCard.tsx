/**
 * MetricTrendCard — KPI horizontal con mini-chart (patrón Aurora / executive dashboard).
 * Métrica a la izquierda, tendencia (Sparkline, bar mini, etc.) a la derecha.
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import type { StatCardTone } from "./StatCard";

export interface MetricTrendCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: ReactNode;
  tone?: StatCardTone;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const TONE_VALUE_CLASSES: Record<StatCardTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
  neutral: "text-foreground",
};

export function MetricTrendCard({
  title,
  subtitle,
  value,
  trend,
  tone = "primary",
  isLoading = false,
  onClick,
  className,
}: MetricTrendCardProps) {
  const content = (
    <Card
      className={cn(
        onClick && "transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-28" />
          ) : (
            <p
              className={cn(
                "text-2xl font-bold tabular-nums tracking-tight",
                TONE_VALUE_CLASSES[tone],
              )}
            >
              {value}
            </p>
          )}
        </div>
        {trend && !isLoading ? (
          <div className="w-[100px] shrink-0" aria-hidden>
            {trend}
          </div>
        ) : isLoading && trend ? (
          <Skeleton className="h-8 w-[100px] shrink-0 rounded" />
        ) : null}
      </CardContent>
    </Card>
  );

  if (!onClick) return content;

  return (
    <button type="button" className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}
