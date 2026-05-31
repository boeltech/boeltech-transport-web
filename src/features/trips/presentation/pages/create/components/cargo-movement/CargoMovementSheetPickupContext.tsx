import type { CargoSheetPickupStop } from "../CargoMovementSheet";

export interface CargoMovementSheetPickupContextProps {
  pickupStop?: CargoSheetPickupStop | null;
}

export function CargoMovementSheetPickupContext({
  pickupStop,
}: CargoMovementSheetPickupContextProps) {
  if (!pickupStop) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">
        Parada #{pickupStop.index + 1}
      </span>
      : {pickupStop.locationName || pickupStop.address}
      {pickupStop.clientName ? ` · ${pickupStop.clientName}` : null}
    </div>
  );
}
