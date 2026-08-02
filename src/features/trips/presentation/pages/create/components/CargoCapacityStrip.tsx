/**
 * Franja compacta de capacidad para el paso Cargas del wizard.
 *
 * Sustituye a la tarjeta de capacidad + desglose: mantiene visible el peso
 * cargado sin empujar las paradas fuera de pantalla. El tono (normal, atención,
 * excedido) es la única señal de alarma; no hay alerta separada de sobrepeso.
 */

import { Truck } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { wizardCopy } from "../../../copy";

const copy = wizardCopy.cargo;

export interface CargoCapacityStripProps {
  /** Capacidad de la unidad en kg; `null` cuando no está registrada. */
  capacityKg: number | null;
  /** Peso sumado de las mercancías del viaje. */
  loadedKg: number;
  /** Unidad seleccionada (número económico, marca y modelo). */
  vehicleLabel?: string | null;
  /** Hay unidad seleccionada pero sin capacidad registrada. */
  isCapacityUnknown: boolean;
}

export function CargoCapacityStrip({
  capacityKg,
  loadedKg,
  vehicleLabel,
  isCapacityUnknown,
}: CargoCapacityStripProps) {
  const hasCapacity = capacityKg != null && capacityKg > 0;
  const percentage = hasCapacity ? (loadedKg / capacityKg) * 100 : 0;
  const isOver = hasCapacity && loadedKg > capacityKg;
  const isNear = hasCapacity && !isOver && percentage >= 90;

  const formatWeight = copy.format.weight;

  return (
    <div
      className={cn(
        // `top-16` = alto del header fijo del shell: la franja queda justo debajo.
        "sticky top-16 z-20 space-y-2 rounded-lg border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        isOver && "border-destructive/40",
        isNear && "border-warning/40",
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
          <span className="text-sm font-medium">{copy.capacity.title}</span>
          {vehicleLabel && (
            <span className="truncate text-xs text-muted-foreground">
              {vehicleLabel}
            </span>
          )}
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
              ? copy.capacity.loadedOfCapacity(
                  formatWeight(loadedKg),
                  formatWeight(capacityKg),
                )
              : formatWeight(loadedKg)}
          </span>
          {hasCapacity && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {isOver
                ? copy.capacity.excess(formatWeight(loadedKg - capacityKg))
                : copy.capacity.available(
                    formatWeight(capacityKg - loadedKg),
                  )}
            </span>
          )}
        </div>
      </div>

      {hasCapacity && (
        <>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={copy.capacity.title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(percentage, 100))}
            aria-valuetext={copy.capacity.usage(percentage)}
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
          {isOver && (
            <p className="text-xs text-destructive">
              {copy.capacity.overCapacityHint}
            </p>
          )}
        </>
      )}

      {isCapacityUnknown && (
        <p className="text-xs text-muted-foreground">
          {copy.capacity.unknownTitle}. {copy.capacity.unknownBody}
        </p>
      )}
    </div>
  );
}
