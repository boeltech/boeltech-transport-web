/**
 * Franja del viaje (D2): fases + 6 datos clave. Reemplaza StatCards.
 */

import { Check, X } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";

import type { TripJourneyStripModel } from "../../helpers/buildTripJourneyStripModel";

export type TripJourneyStripProps = {
  model: TripJourneyStripModel;
  className?: string;
};

export function TripJourneyStrip({ model, className }: TripJourneyStripProps) {
  const { phases, facts } = model;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      aria-label="Estado y datos clave del viaje"
      data-testid="trip-journey-strip"
    >
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-2.5 text-[13px]">
        {phases.map((phase, index) => {
          const isCancelledCurrent =
            phase.state === "current" && phase.id === "cancelled";
          return (
          <div key={phase.id} className="flex min-w-0 items-center gap-2.5">
            {index > 0 ? (
              <span
                className="hidden h-px min-w-4 flex-1 bg-border sm:block"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap",
                phase.state === "upcoming" && "text-muted-foreground",
                phase.state === "done" && "text-foreground",
                phase.state === "current" && "font-semibold text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  phase.state === "done" &&
                    "border-transparent bg-success/15 text-success",
                  isCancelledCurrent &&
                    "border-transparent bg-destructive text-destructive-foreground",
                  phase.state === "current" &&
                    !isCancelledCurrent &&
                    "border-info bg-info text-info-foreground",
                  phase.state === "upcoming" &&
                    "border-border text-muted-foreground",
                )}
                aria-hidden
                data-testid={
                  isCancelledCurrent
                    ? "trip-journey-phase-cancelled-current"
                    : undefined
                }
              >
                {phase.state === "done" ? (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                ) : isCancelledCurrent ? (
                  <X className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  phase.stepNumber
                )}
              </span>
              <span>
                {phase.label}
                {phase.detail ? (
                  <small className="ml-1.5 font-normal text-muted-foreground">
                    {phase.detail}
                  </small>
                ) : null}
              </span>
            </span>
          </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className="flex min-w-0 flex-col gap-0.5 border-b border-r border-border px-4 py-2.5 last:border-r-0 sm:[&:nth-child(3n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(3n)]:border-r lg:[&:nth-child(6n)]:border-r-0"
            data-testid={`trip-journey-fact-${fact.id}`}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {fact.label}
            </span>
            <span
              className={cn(
                "truncate text-sm font-semibold tabular-nums",
                fact.tone === "missing" && "text-warning",
                fact.tone === "warning" && "text-warning",
              )}
            >
              {fact.value}
            </span>
            {fact.detail ? (
              <span
                className={cn(
                  "truncate text-xs text-muted-foreground",
                  fact.tone === "warning" && "text-warning",
                )}
              >
                {fact.detail}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
