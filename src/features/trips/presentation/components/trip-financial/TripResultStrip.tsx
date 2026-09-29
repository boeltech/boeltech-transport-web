/**
 * Franja compacta del resultado estimado del viaje (paso Costos).
 *
 * Muestra utilidad y margen con tono normal / atención / bajo. Sustituye a la
 * alerta inferior de margen crítico: la señal vive aquí.
 */

import { CircleDollarSign } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "./financialSummary";
import type { FinancialHealth } from "./financialSummary";
import { wizardCopy } from "../../copy";

const copy = wizardCopy.costs.result;

export interface TripResultStripProps {
  income: number;
  conceptsTotal: number;
  utility: number;
  marginPct: number | null;
  health: FinancialHealth;
  className?: string;
}

function healthTone(health: FinancialHealth): {
  border: string;
  icon: string;
  value: string;
  bar: string;
} {
  switch (health) {
    case "critical":
      return {
        border: "border-destructive/40",
        icon: "text-destructive",
        value: "text-destructive",
        bar: "bg-destructive",
      };
    case "warning":
      return {
        border: "border-warning/40",
        icon: "text-warning",
        value: "text-warning",
        bar: "bg-warning",
      };
    case "healthy":
      return {
        border: "border-success/40",
        icon: "text-success",
        value: "text-success",
        bar: "bg-success",
      };
    default:
      return {
        border: "",
        icon: "text-muted-foreground",
        value: "text-foreground",
        bar: "bg-primary",
      };
  }
}

function healthHint(health: FinancialHealth): string {
  switch (health) {
    case "critical":
      return copy.criticalHint;
    case "warning":
      return copy.warningHint;
    case "healthy":
      return copy.healthyHint;
    default:
      return copy.neutralHint;
  }
}

export function TripResultStrip({
  income,
  conceptsTotal,
  utility,
  marginPct,
  health,
  className,
}: TripResultStripProps) {
  const tone = healthTone(health);
  const barWidth =
    marginPct == null ? 0 : Math.max(0, Math.min(marginPct, 100));

  return (
    <div
      className={cn(
        "sticky top-16 z-20 space-y-2 rounded-lg border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        tone.border,
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <CircleDollarSign className={cn("h-4 w-4 shrink-0", tone.icon)} />
          <span className="text-sm font-medium">{copy.title}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-xs text-muted-foreground">
            {copy.income}{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatMxCurrency(income)}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {copy.concepts}{" "}
            <span className="font-medium text-foreground tabular-nums">
              −{formatMxCurrency(conceptsTotal)}
            </span>
          </span>
          <span className={cn("font-semibold tabular-nums", tone.value)}>
            {copy.utility} {formatMxCurrency(utility)}
            {marginPct != null ? ` · ${copy.formatMarginPct(marginPct)}` : ""}
          </span>
        </div>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={copy.margin}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={marginPct == null ? 0 : Math.round(Math.min(marginPct, 100))}
        aria-valuetext={
          marginPct == null ? copy.neutralHint : copy.formatMarginPct(marginPct)
        }
      >
        <div
          className={cn("h-full transition-all duration-300", tone.bar)}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p
        className={cn(
          "text-xs",
          health === "critical"
            ? "text-destructive"
            : health === "warning"
              ? "text-warning"
              : "text-muted-foreground",
        )}
      >
        {healthHint(health)}
      </p>
    </div>
  );
}
