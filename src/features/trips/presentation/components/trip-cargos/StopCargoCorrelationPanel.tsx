import { Loader2, Package, Truck } from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  type CargoStatusType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import { getStopCargoLinks } from "../../utils/stopCargoCorrelation";

const copy = tripDetailCopy.cargo;

export interface StopCargoCorrelationPanelProps {
  stop: TripStop;
  cargos: readonly TripCargo[];
  orderedStops?: readonly TripStop[];
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  /** Solo Seguimiento: permite completar movimientos en parada. */
  interactive?: boolean;
  tripInProgress?: boolean;
  pendingMovementId?: string | null;
  onCompleteMovement?: (
    cargoId: string,
    movementId: string,
    movementType: "pickup" | "delivery",
  ) => void;
  className?: string;
}

export function StopCargoCorrelationPanel({
  stop,
  cargos,
  orderedStops,
  getCargoStatusVariant,
  interactive = false,
  tripInProgress = false,
  pendingMovementId,
  onCompleteMovement,
  className,
}: StopCargoCorrelationPanelProps) {
  const links = getStopCargoLinks(stop, cargos, orderedStops);
  if (links.length === 0) return null;

  return (
    <div className={cn("space-y-2 rounded-md border border-dashed bg-muted/20 p-2.5", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Package className="h-3.5 w-3.5 shrink-0" />
        {copy.section.atStop}
      </p>
      <ul className="space-y-1.5">
        {links.map((link) => {
          const isCompleted = link.movement.completedAt != null;
          const canComplete =
            interactive &&
            tripInProgress &&
            !isCompleted &&
            onCompleteMovement &&
            link.movement.id;

          return (
            <li
              key={`${link.cargo.id}-${link.movement.id ?? link.movementType}`}
              className="flex flex-col gap-1.5 rounded border bg-background/80 px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {link.movementType === "pickup" ? (
                    <Package className="h-3 w-3 shrink-0 text-info" aria-hidden />
                  ) : (
                    <Truck className="h-3 w-3 shrink-0 text-warning" aria-hidden />
                  )}
                  <span className="truncate text-xs font-medium">
                    {link.cargo.description}
                  </span>
                  <Badge
                    variant={getCargoStatusVariant(link.cargo.status)}
                    className="text-[10px] font-normal"
                  >
                    {CARGO_STATUS_LABELS[link.cargo.status] ?? link.cargo.status}
                  </Badge>
                  {isCompleted ? (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {copy.label.movementDone}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {canComplete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  disabled={pendingMovementId === link.movement.id}
                  onClick={() =>
                    onCompleteMovement!(
                      link.cargo.id,
                      link.movement.id!,
                      link.movementType,
                    )
                  }
                >
                  {pendingMovementId === link.movement.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {link.movementType === "pickup"
                    ? copy.action.completePickupHere
                    : copy.action.completeDeliveryHere}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
