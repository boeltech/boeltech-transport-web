/**
 * Franja 3 cells Operate del tab Cargas (artboard Operate-Viaje-Cargas).
 * Reemplaza `CargoCapacityStrip` en el detalle; el wizard sigue con la franja.
 */

import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

export type TripCargoSummaryStripProps = {
  capacityKg: number | null;
  loadedKg: number;
  /** Número económico de la unidad (TR-104); null si no hay flota. */
  unitNumber: string | null;
  /** Hay vehicleId pero sin capacidad registrada. */
  isCapacityUnknown: boolean;
  /** Viaje aún mutable → hint de sobrecupo accionable. */
  capacityMutable: boolean;
  cargoCount: number;
  totalUnits: number;
  /** «Recogidas en …» cuando todas comparten parada. */
  pickupSummaryLabel: string | null;
  inTransitCount: number;
  deliveredCount: number;
  className?: string;
};

function formatKg(kg: number): string {
  return kg.toLocaleString("es-MX");
}

export function TripCargoSummaryStrip({
  capacityKg,
  loadedKg,
  unitNumber,
  isCapacityUnknown,
  capacityMutable,
  cargoCount,
  totalUnits,
  pickupSummaryLabel,
  inTransitCount,
  deliveredCount,
  className,
}: TripCargoSummaryStripProps) {
  const hasCapacity = capacityKg != null && capacityKg > 0;
  const percentage = hasCapacity ? (loadedKg / capacityKg) * 100 : 0;
  const isOver = hasCapacity && loadedKg > capacityKg;
  const isNear = hasCapacity && !isOver && percentage >= 90;

  let weightValue: string;
  let weightDetail: string | null;
  if (!unitNumber && !hasCapacity) {
    weightValue = copy.summary.noVehicleValue;
    weightDetail = copy.summary.noVehicleDetail;
  } else if (isCapacityUnknown || !hasCapacity) {
    weightValue =
      loadedKg > 0
        ? copy.summary.loadedOnlyKg(formatKg(loadedKg))
        : copy.capacity.unknownTitle;
    weightDetail = copy.capacity.unknownBody;
  } else {
    weightValue = copy.summary.loadedOfCapacityKg(
      formatKg(loadedKg),
      formatKg(capacityKg),
    );
    if (isOver) {
      weightDetail = capacityMutable
        ? copy.capacity.overCapacityHint
        : copy.capacity.overCapacityHintReadonly;
    } else if (unitNumber) {
      weightDetail = copy.summary.percentOfCapacity(percentage, unitNumber);
    } else {
      weightDetail = copy.capacity.usage(percentage);
    }
  }

  const cargosValue = copy.summary.cargosLine(cargoCount, totalUnits);
  let cargosDetail: string;
  if (cargoCount === 0) {
    cargosDetail = copy.summary.emptyCargosDetail;
  } else if (pickupSummaryLabel) {
    cargosDetail = copy.summary.pickedUpAt(pickupSummaryLabel);
  } else if (loadedKg > 0) {
    cargosDetail = copy.summary.totalWeightDetail(loadedKg);
  } else {
    cargosDetail = copy.hint.list;
  }

  const hasYardActivity = inTransitCount > 0 || deliveredCount > 0;
  const yardValue = hasYardActivity
    ? copy.summary.yardLine(inTransitCount, deliveredCount)
    : copy.summary.yardEmpty;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        isOver && "border-destructive/40",
        isNear && !isOver && "border-warning/40",
        className,
      )}
      aria-label={copy.section.summary}
      data-testid="trip-cargo-summary-strip"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div
          className={cn(
            "flex min-w-0 flex-col gap-0.5 border-b border-border px-5 py-3 sm:border-b-0 sm:border-r",
            isOver && "bg-destructive/5",
          )}
          data-testid="trip-cargo-summary-weight"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {copy.capacity.title}
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums tracking-tight",
              isOver && "text-destructive",
              isNear && !isOver && "text-warning",
            )}
          >
            {weightValue}
          </span>
          {hasCapacity ? (
            <div
              className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
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
          ) : null}
          {weightDetail ? (
            <span
              className={cn(
                "text-xs text-muted-foreground",
                isOver && "text-destructive",
              )}
            >
              {weightDetail}
            </span>
          ) : null}
        </div>

        <div
          className="flex min-w-0 flex-col gap-0.5 border-b border-border px-5 py-3 sm:border-b-0 sm:border-r"
          data-testid="trip-cargo-summary-count"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {copy.summary.cargosTitle}
          </span>
          <span className="text-sm font-semibold tabular-nums tracking-tight">
            {cargosValue}
          </span>
          <span className="text-xs text-muted-foreground">{cargosDetail}</span>
        </div>

        <div
          className="flex min-w-0 flex-col gap-0.5 px-5 py-3"
          data-testid="trip-cargo-summary-yard"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {copy.hint.statusInTracking}
          </span>
          <span className="text-sm font-semibold tabular-nums tracking-tight">
            {yardValue}
          </span>
          <span className="text-xs text-muted-foreground">
            {copy.summary.yardHint}
          </span>
        </div>
      </div>
    </section>
  );
}
