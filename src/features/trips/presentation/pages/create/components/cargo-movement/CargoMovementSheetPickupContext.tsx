import { MapPin } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { FormFieldShell } from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { wizardCopy } from "../../../../copy";
import type { CargoSheetPickupStop } from "../CargoMovementSheet";

const sheet = wizardCopy.cargo.sheet;
const formatWeight = wizardCopy.cargo.format.weight;
const stopLabel = wizardCopy.cargo.format.stopFallback;

export interface CargoMovementSheetPickupContextProps {
  pickupStop?: CargoSheetPickupStop | null;
  /** Paradas de recogida elegibles en alta (detalle con varios pickups). */
  availablePickupStops?: CargoSheetPickupStop[];
  /** Solo en alta: cambia la parada de recogida sin cerrar el sheet. */
  onPickupStopChange?: (stop: CargoSheetPickupStop) => void;
  /** Mercancías ya registradas en esta parada. */
  stopCargoCount: number;
  /** Peso libre en la unidad antes de esta mercancía; `null` si no hay capacidad. */
  availableKg: number | null;
}

export function CargoMovementSheetPickupContext({
  pickupStop,
  availablePickupStops,
  onPickupStopChange,
  stopCargoCount,
  availableKg,
}: CargoMovementSheetPickupContextProps) {
  if (!pickupStop) return null;

  const canChoosePickup =
    Boolean(onPickupStopChange) &&
    (availablePickupStops?.length ?? 0) > 1;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      {canChoosePickup && availablePickupStops ? (
        <FormFieldShell
          fieldId="cargo-pickup-stop"
          label={sheet.label.pickupStop}
          description={sheet.hint.pickupStop}
        >
          <Select
            value={String(pickupStop.index)}
            onValueChange={(value) => {
              const next = availablePickupStops.find(
                (stop) => String(stop.index) === value,
              );
              if (next) onPickupStopChange?.(next);
            }}
          >
            <SelectTrigger id="cargo-pickup-stop" className="h-9 bg-background">
              <SelectValue placeholder={sheet.placeholder.pickupStop} />
            </SelectTrigger>
            <SelectContent>
              {availablePickupStops.map((stop) => (
                <SelectItem key={stop.index} value={String(stop.index)}>
                  {sheet.format.deliveryStopOption(
                    stop.index,
                    stop.locationName || "",
                    stop.address,
                    stop.city,
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldShell>
      ) : (
        <p className="text-sm text-muted-foreground">
          <MapPin className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
          {sheet.context.stopPrefix}{" "}
          <span className="font-medium text-foreground">
            {stopLabel(pickupStop.index)}
          </span>{" "}
          · {pickupStop.locationName || pickupStop.address}
          {pickupStop.clientName ? ` · ${pickupStop.clientName}` : null}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="neutral" tone="soft" className="font-normal">
          {stopCargoCount > 0
            ? sheet.context.registeredHere(stopCargoCount)
            : sheet.context.noneRegisteredHere}
        </Badge>
        {availableKg != null && (
          <Badge
            variant={availableKg < 0 ? "destructive" : "info"}
            tone="soft"
            className="font-normal"
          >
            {availableKg < 0
              ? sheet.context.overCapacity(formatWeight(Math.abs(availableKg)))
              : sheet.context.available(formatWeight(availableKg))}
          </Badge>
        )}
      </div>
    </div>
  );
}
