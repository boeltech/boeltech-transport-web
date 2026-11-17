/**
 * Barra apilada de disponibilidad + leyenda — patrón hub (evolve-ds Inicio F2).
 * Segmentos proporcionales al total; leyenda con swatch + conteo mono.
 */

import { Link } from "react-router-dom";

import { cn } from "@shared/lib/utils/cn";

export type StackedAvailabilityTone =
  | "free"
  | "onTrip"
  | "maintenance"
  | "idle";

export interface StackedAvailabilitySegment {
  id: string;
  label: string;
  count: number;
  tone: StackedAvailabilityTone;
}

export interface StackedAvailabilityBarProps {
  /** Número destacado (p. ej. libres). */
  freeCount: number;
  /** Texto tras el número: «de 18 unidades libres». */
  freeCaption: string;
  href?: string;
  linkLabel?: string;
  segments: readonly StackedAvailabilitySegment[];
  className?: string;
}

const TONE_BG: Record<StackedAvailabilityTone, string> = {
  free: "bg-success",
  onTrip: "bg-primary",
  maintenance: "bg-warning",
  idle: "bg-border",
};

export function StackedAvailabilityBar({
  freeCount,
  freeCaption,
  href,
  linkLabel,
  segments,
  className,
}: StackedAvailabilityBarProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.count), 0);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xl font-bold tabular-nums text-foreground">
          {freeCount}
        </span>
        <span className="text-[13px] text-muted-foreground">{freeCaption}</span>
        {href && linkLabel ? (
          <Link
            to={href}
            className="ml-auto text-xs font-medium text-primary-700 no-underline hover:underline"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>

      <div
        className="flex h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={segments
          .map((s) => `${s.label}: ${s.count}`)
          .join(", ")}
      >
        {total > 0
          ? segments.map((s) => {
              const pct = (Math.max(0, s.count) / total) * 100;
              if (pct <= 0) return null;
              return (
                <span
                  key={s.id}
                  className={cn("block h-full", TONE_BG[s.tone])}
                  style={{ width: `${pct}%` }}
                />
              );
            })
          : null}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-sm", TONE_BG[s.tone])}
              aria-hidden
            />
            {s.label}{" "}
            <b className="font-mono font-semibold text-foreground">{s.count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
