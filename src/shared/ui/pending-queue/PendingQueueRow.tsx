/**
 * Fila de pendiente — patrón hub «Lo que te toca» (evolve-ds Inicio F1).
 * Dot de urgencia · título+área · desglose · conteo/importe · chevron/CTA.
 * Variantes: default | error (+ Reintentar) | skeleton.
 */

import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

export type PendingQueueUrgency = "critical" | "warning" | "info";

export interface PendingQueueRowProps {
  title: string;
  area: string;
  breakdown?: string;
  /** Conteo o importe formateado (p. ej. `4` o `$31,480.00`). */
  value: ReactNode;
  /** Subvalor bajo el conteo (p. ej. importe de Listos). */
  valueHint?: ReactNode;
  ctaLabel: string;
  href: string;
  urgency?: PendingQueueUrgency;
  className?: string;
}

export interface PendingQueueErrorRowProps {
  title: string;
  area: string;
  message?: string;
  onRetry: () => void;
  retryLabel?: string;
  className?: string;
}

const URGENCY_DOT: Record<PendingQueueUrgency, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-primary",
};

export function PendingQueueRow({
  title,
  area,
  breakdown,
  value,
  valueHint,
  ctaLabel,
  href,
  urgency = "info",
  className,
}: PendingQueueRowProps) {
  return (
    <Link
      to={href}
      className={cn(
        "grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-center gap-x-3.5 gap-y-0.5 border-b border-border px-5 py-3 text-inherit no-underline last:border-b-0",
        "transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        className={cn(
          "row-span-2 h-2.5 w-2.5 shrink-0 self-center rounded-full",
          URGENCY_DOT[urgency],
        )}
        aria-hidden
      />
      <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        <span className="truncate">{title}</span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-border px-1.5 text-[11px] font-medium leading-[18px] text-muted-foreground">
          {area}
        </span>
      </span>
      <span className="row-span-2 self-center text-right font-mono text-xl font-bold tabular-nums text-foreground">
        {value}
        {valueHint ? (
          <span className="mt-0.5 block font-sans text-[11px] font-medium text-muted-foreground">
            {valueHint}
          </span>
        ) : null}
      </span>
      <span className="row-span-2 inline-flex items-center gap-0.5 self-center justify-self-end whitespace-nowrap text-[13px] font-medium text-primary">
        {ctaLabel}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </span>
      {breakdown ? (
        <span className="col-start-2 truncate text-xs text-muted-foreground">
          {breakdown}
        </span>
      ) : (
        <span className="col-start-2" />
      )}
    </Link>
  );
}

export function PendingQueueErrorRow({
  title,
  area,
  message = "No se pudo cargar este conteo.",
  onRetry,
  retryLabel = "Reintentar",
  className,
}: PendingQueueErrorRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-x-3.5 border-b border-border px-5 py-3 last:border-b-0",
        className,
      )}
      role="alert"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span>{title}</span>
          <span className="inline-flex shrink-0 items-center rounded-full border border-border px-1.5 text-[11px] font-medium leading-[18px] text-muted-foreground">
            {area}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

export function PendingQueueRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[10px_minmax(0,1fr)_auto_96px] items-center gap-x-3.5 border-b border-border px-5 py-3 last:border-b-0",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-7 w-8 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
    </div>
  );
}
