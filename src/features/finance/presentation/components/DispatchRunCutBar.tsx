/**
 * Franja sticky de Mesa de corte — periodo · frecuencia · conteos tipados · CTA Mandar.
 * Craft = composición; primitivos = Button / tokens Patio.
 */

import type { ReactNode } from "react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.detail;

export interface DispatchRunCutBarProps {
  periodLabel: string;
  frequencyName: string;
  invoiceCount: number;
  repCount: number;
  pendingCount: number;
  showSend: boolean;
  sendDisabled?: boolean;
  isPending?: boolean;
  onSend?: () => void;
  /**
   * Riel ámbar bajo chips. Apagar si la card Faltan está abierta
   * (pulido D4: chip + riel XOR card abierta).
   */
  showPendingRail?: boolean;
  /** Acciones secundarias (Más: actualizar / cancelar) a la derecha del CTA. */
  secondaryActions?: ReactNode;
  className?: string;
}

export function DispatchRunCutBar({
  periodLabel,
  frequencyName,
  invoiceCount,
  repCount,
  pendingCount,
  showSend,
  sendDisabled = false,
  isPending = false,
  onSend,
  showPendingRail = true,
  secondaryActions,
  className,
}: DispatchRunCutBarProps) {
  return (
    <section
      aria-label={copy.cutBar.ariaLabel}
      className={cn(
        "sticky top-14 z-20 -mx-1 border border-border bg-card px-3 py-3 shadow-sm sm:mx-0 sm:rounded-lg sm:px-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {copy.cutBar.periodLabel}
            </span>
            <span className="truncate text-sm font-semibold tabular-nums text-foreground">
              {periodLabel}
            </span>
          </div>
          <div
            className="hidden h-7 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {copy.cutBar.frequencyLabel}
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {frequencyName}
            </span>
          </div>
          <div
            className="hidden h-7 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label={copy.cutBar.countsAria}
          >
            <CountChip
              value={invoiceCount}
              label={copy.counts.readyInvoices}
            />
            <CountChip value={repCount} label={copy.counts.readyReps} />
            {pendingCount > 0 ? (
              <CountChip
                value={pendingCount}
                label={copy.counts.pendingStamp}
                tone="warning"
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {showSend ? (
            <Button
              type="button"
              size="sm"
              disabled={sendDisabled || isPending}
              onClick={onSend}
            >
              {copy.sendCta}
            </Button>
          ) : null}
          {secondaryActions}
        </div>
      </div>
      {pendingCount > 0 && showPendingRail ? (
        <p className="mt-2 border-l-2 border-warning bg-warning-soft px-2.5 py-1.5 text-xs text-warning-soft-foreground">
          {copy.cutBar.pendingNote(pendingCount)}
        </p>
      ) : null}
    </section>
  );
}

function CountChip({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full border px-2.5 py-1",
        tone === "warning"
          ? "border-warning/40 bg-warning-soft text-warning-soft-foreground"
          : "border-transparent bg-muted text-foreground",
      )}
    >
      <span
        className={cn(
          "font-semibold tabular-nums leading-none tracking-tight",
          tone === "warning" ? "text-lg" : "text-2xl",
        )}
      >
        {value}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </span>
  );
}
