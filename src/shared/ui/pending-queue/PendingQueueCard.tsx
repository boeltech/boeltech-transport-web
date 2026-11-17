/**
 * Contenedor de filas de pendiente + franja «Al día» + vacío total.
 */

import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";

export interface PendingQueueCardProps {
  children: ReactNode;
  className?: string;
  /** Chips de bandejas en cero (debajo de las filas). */
  clearChips?: readonly string[];
  clearLabel?: string;
  /** Estado vacío total (todas en 0, sin errores). */
  empty?: {
    title: string;
    description?: string;
  };
}

export function PendingQueueCard({
  children,
  className,
  clearChips,
  clearLabel = "Al día:",
  empty,
}: PendingQueueCardProps) {
  if (empty) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-1 px-5 py-7 text-center">
          <CheckCircle2
            className="mb-1 h-5 w-5 text-success"
            aria-hidden
          />
          <p className="text-[15px] font-semibold text-foreground">
            {empty.title}
          </p>
          {empty.description ? (
            <p className="text-[13px] text-muted-foreground">
              {empty.description}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const chips = clearChips?.filter(Boolean) ?? [];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {children}
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted px-5 py-2.5 text-xs text-muted-foreground">
          <span>{clearLabel}</span>
          {chips.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 leading-5 text-foreground"
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-success"
                aria-hidden
              />
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
