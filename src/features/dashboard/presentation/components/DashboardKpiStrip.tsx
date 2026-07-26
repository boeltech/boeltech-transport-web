/**
 * DashboardKpiStrip — franja KPI unida (patrón SaasAble Overview).
 * Un shell con celdas separadas por divisores; sin cards individuales.
 */

import { cn } from "@shared/lib/utils/cn";
import { Skeleton } from "@shared/ui/skeleton";

export type DashboardKpiTone =
  | "default"
  | "success"
  | "warning"
  | "destructive";

export interface DashboardKpiCell {
  label: string;
  value: string | number | undefined;
  caption?: string;
  tone?: DashboardKpiTone;
  isLoading?: boolean;
}

const TONE_CLASS: Record<DashboardKpiTone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

interface DashboardKpiStripProps {
  cells: DashboardKpiCell[];
  className?: string;
  /** Etiqueta accesible del grupo de métricas */
  "aria-label"?: string;
}

export function DashboardKpiStrip({
  cells,
  className,
  "aria-label": ariaLabel,
}: DashboardKpiStripProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cn(
              "flex flex-col justify-between gap-6 p-5 sm:p-6",
              index % 2 === 0 && "border-r border-border",
              index < 2 && "border-b border-border lg:border-b-0",
              index < cells.length - 1 && "lg:border-r lg:border-border",
              index % 2 === 1 && "max-lg:border-r-0",
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {cell.label}
            </p>
            <div className="space-y-1">
              {cell.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p
                  className={cn(
                    "text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
                    TONE_CLASS[cell.tone ?? "default"],
                  )}
                >
                  {cell.value ?? "—"}
                </p>
              )}
              {cell.caption ? (
                <p className="text-xs text-muted-foreground">{cell.caption}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
