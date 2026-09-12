/**
 * Franja compacta de capacidad (wizard Cargas y tab Cargas del detalle).
 *
 * Mantiene visible el peso cargado vs capacidad de la unidad. El tono
 * (normal, atención, excedido) es la única señal de alarma; no bloquea.
 */

import { Truck } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";

export type CargoCapacityStripMessages = {
  title: string;
  unknownTitle: string;
  unknownBody: string;
  overCapacityHint: string;
  usage: (percentage: number) => string;
  loadedOfCapacity: (loaded: string, capacity: string) => string;
  available: (formatted: string) => string;
  excess: (formatted: string) => string;
  formatWeight: (weightKg: number) => string;
};

export interface CargoCapacityStripProps {
  /** Capacidad de la unidad en kg; `null` cuando no está registrada. */
  capacityKg: number | null;
  /** Peso sumado de las mercancías del viaje. */
  loadedKg: number;
  /** Unidad seleccionada (número económico, marca y modelo). */
  vehicleLabel?: string | null;
  /** Hay unidad seleccionada pero sin capacidad registrada. */
  isCapacityUnknown: boolean;
  messages: CargoCapacityStripMessages;
  /**
   * Sticky bajo el header del wizard (`top-16`). En tabs del detalle usar `false`.
   * @default true
   */
  sticky?: boolean;
  className?: string;
}

export function CargoCapacityStrip({
  capacityKg,
  loadedKg,
  vehicleLabel,
  isCapacityUnknown,
  messages,
  sticky = true,
  className,
}: CargoCapacityStripProps) {
  const hasCapacity = capacityKg != null && capacityKg > 0;
  const percentage = hasCapacity ? (loadedKg / capacityKg) * 100 : 0;
  const isOver = hasCapacity && loadedKg > capacityKg;
  const isNear = hasCapacity && !isOver && percentage >= 90;

  const formatWeight = messages.formatWeight;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        sticky && "sticky top-16 z-20",
        isOver && "border-destructive/40",
        isNear && "border-warning/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <Truck
            className={cn(
              "h-4 w-4 shrink-0",
              isOver
                ? "text-destructive"
                : isNear
                  ? "text-warning"
                  : "text-muted-foreground",
            )}
          />
          <span className="text-sm font-medium">{messages.title}</span>
          {vehicleLabel ? (
            <span className="truncate text-xs text-muted-foreground">
              {vehicleLabel}
            </span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-2 text-sm">
          <span
            className={cn(
              "font-semibold tabular-nums",
              isOver && "text-destructive",
              isNear && "text-warning",
            )}
          >
            {hasCapacity
              ? messages.loadedOfCapacity(
                  formatWeight(loadedKg),
                  formatWeight(capacityKg),
                )
              : formatWeight(loadedKg)}
          </span>
          {hasCapacity ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {isOver
                ? messages.excess(formatWeight(loadedKg - capacityKg))
                : messages.available(formatWeight(capacityKg - loadedKg))}
            </span>
          ) : null}
        </div>
      </div>

      {hasCapacity ? (
        <>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={messages.title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(percentage, 100))}
            aria-valuetext={messages.usage(percentage)}
          >
            <div
              className={cn(
                "h-full transition-all duration-300",
                isOver
                  ? "bg-destructive"
                  : isNear
                    ? "bg-warning"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          {isOver ? (
            <p className="text-xs text-destructive">
              {messages.overCapacityHint}
            </p>
          ) : null}
        </>
      ) : null}

      {isCapacityUnknown ? (
        <p className="text-xs text-muted-foreground">
          {messages.unknownTitle}. {messages.unknownBody}
        </p>
      ) : null}
    </div>
  );
}
