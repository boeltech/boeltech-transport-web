import { MapPin } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { wizardCopy } from "../../../../copy";
import type { CargoSheetPickupStop } from "../CargoMovementSheet";

const sheet = wizardCopy.cargo.sheet;
const formatWeight = wizardCopy.cargo.format.weight;
const stopLabel = wizardCopy.cargo.format.stopFallback;

export interface CargoMovementSheetPickupContextProps {
  pickupStop?: CargoSheetPickupStop | null;
  /** Mercancías ya registradas en esta parada. */
  stopCargoCount: number;
  /** Peso libre en la unidad antes de esta mercancía; `null` si no hay capacidad. */
  availableKg: number | null;
}

export function CargoMovementSheetPickupContext({
  pickupStop,
  stopCargoCount,
  availableKg,
}: CargoMovementSheetPickupContextProps) {
  if (!pickupStop) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <p className="text-sm text-muted-foreground">
        <MapPin className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
        {sheet.context.stopPrefix}{" "}
        <span className="font-medium text-foreground">
          {stopLabel(pickupStop.index)}
        </span>{" "}
        · {pickupStop.locationName || pickupStop.address}
        {pickupStop.clientName ? ` · ${pickupStop.clientName}` : null}
      </p>

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
