/**
 * Fila resumen del sheet de carga (C3): «En esta parada · N cargas…» + unidad / quedan kg.
 * El selector de recogida vive en «Dónde va» (F1 stub / F2 completo).
 */

import { wizardCopy } from "../../../../copy";

const sheet = wizardCopy.cargo.sheet;
const formatWeight = wizardCopy.cargo.format.weight;

export interface CargoMovementSheetPickupContextProps {
  /** Cargas ya registradas en esta parada. */
  stopCargoCount: number;
  /** Peso libre en la unidad antes de esta carga; `null` si no hay capacidad. */
  availableKg: number | null;
  /** Número económico de la unidad; `null` / vacío → Sin asignar. */
  vehicleUnitNumber?: string | null;
}

export function CargoMovementSheetPickupContext({
  stopCargoCount,
  availableKg,
  vehicleUnitNumber = null,
}: CargoMovementSheetPickupContextProps) {
  const registeredLabel =
    stopCargoCount > 0
      ? sheet.context.registeredHere(stopCargoCount)
      : sheet.context.noneRegisteredHere;

  const unitAssigned = Boolean(vehicleUnitNumber?.trim());
  const unitSide = unitAssigned
    ? [
        sheet.context.unitLabel(vehicleUnitNumber),
        availableKg != null
          ? availableKg < 0
            ? sheet.context.overCapacity(formatWeight(Math.abs(availableKg)))
            : sheet.context.availableKg(
                Math.round(availableKg).toLocaleString("es-MX"),
              )
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : sheet.context.unitUnassigned;

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 sm:grid-cols-2">
      <p className="min-w-0 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {sheet.context.summaryStopLabel}
        </span>
        <span className="mx-1 text-border" aria-hidden>
          ·
        </span>
        <span>{registeredLabel}</span>
      </p>
      <p
        className="min-w-0 truncate text-xs text-muted-foreground sm:text-right"
        title={unitSide}
      >
        {unitSide}
      </p>
    </div>
  );
}
