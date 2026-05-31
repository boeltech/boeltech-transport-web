import {
  AlertTriangle,
  Box,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Package,
  Scale,
  Truck,
} from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  CargoStatus,
  type CargoStatusType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { getStopLabelForCargo, isCargoHazmat } from "./tripCargoDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

export interface TripDetailCargoItemCardProps {
  cargo: TripCargo;
  orderedStops: TripStop[];
  formatCurrency: (amount: number) => string;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  canDeliverCargo: boolean;
  isDeliverPending: boolean;
  onDeliverCargo: (cargoId: string) => void;
  /** Muestra cliente contratante de la carga (vista por mercancía). */
  showClient?: boolean;
  /** Destaca valor declarado en columna lateral (vista por mercancía). */
  emphasizeDeclaredValue?: boolean;
  className?: string;
}

export function TripDetailCargoItemCard({
  cargo,
  orderedStops,
  formatCurrency,
  getCargoStatusVariant,
  canDeliverCargo,
  isDeliverPending,
  onDeliverCargo,
  showClient = false,
  emphasizeDeclaredValue = false,
  className,
}: TripDetailCargoItemCardProps) {
  const isHazmat = isCargoHazmat(cargo);
  const pickups = (cargo.movements ?? []).filter(
    (movement) => movement.movementType === "pickup",
  );
  const deliveries = (cargo.movements ?? []).filter(
    (movement) => movement.movementType === "delivery",
  );

  const canDeliver =
    canDeliverCargo &&
    cargo.status !== CargoStatus.DELIVERED &&
    cargo.status !== CargoStatus.CANCELLED;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 transition-colors lg:flex-row lg:items-start lg:justify-between",
        isHazmat && "border-warning/30 bg-warning-soft/30",
        emphasizeDeclaredValue && "hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Package
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isHazmat ? "text-warning" : "text-muted-foreground",
          )}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-medium leading-snug">{cargo.description}</h4>
            <Badge
              variant={getCargoStatusVariant(cargo.status)}
              className="text-xs font-normal"
            >
              {CARGO_STATUS_LABELS[cargo.status] || cargo.status}
            </Badge>
          </div>

          {showClient && cargo.client ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {cargo.client.legalName}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {cargo.satProductCode ? (
              <span className="inline-flex items-center gap-1 rounded border border-info/30 bg-info-soft px-1.5 py-0.5 text-xs text-info-soft-foreground">
                <FileText className="h-3 w-3" />
                {copy.format.satProductCode(cargo.satProductCode)}
              </span>
            ) : null}
            {isHazmat ? (
              <span className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning-soft px-1.5 py-0.5 text-xs text-warning-soft-foreground">
                <AlertTriangle className="h-3 w-3" />
                {copy.label.hazmat}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(cargo.weightInKg ?? cargo.weight) ? (
              <span className="inline-flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {cargo.weightInKg ?? cargo.weight} kg
              </span>
            ) : null}
            {cargo.units ? (
              <span className="inline-flex items-center gap-1">
                <Box className="h-3 w-3" />
                {cargo.units} {cargo.satUnitName || copy.label.defaultUnits}
              </span>
            ) : null}
            {cargo.volume ? <span>{copy.format.volume(cargo.volume)}</span> : null}
            {cargo.declaredValue && !emphasizeDeclaredValue ? (
              <span>{copy.format.declaredValueInline(formatCurrency(cargo.declaredValue))}</span>
            ) : null}
            {cargo.aseguraCarga ? (
              <span>{copy.format.insurance(cargo.aseguraCarga)}</span>
            ) : null}
            {cargo.polizaCarga ? (
              <span className="font-mono">{copy.format.policy(cargo.polizaCarga)}</span>
            ) : null}
          </div>

          {pickups.length > 0 || deliveries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {pickups.map((pickup, idx) => (
                <span
                  key={pickup.id ?? `pickup-${idx}`}
                  className="inline-flex items-center gap-1 rounded border border-info/30 bg-info-soft px-1.5 py-0.5 text-xs text-info-soft-foreground"
                >
                  <Package className="h-3 w-3" />
                  {copy.format.pickupAtStop(
                    getStopLabelForCargo(pickup.stopIndex, orderedStops),
                    pickup.weight != null
                      ? copy.format.weightSuffix(pickup.weight)
                      : undefined,
                  )}
                </span>
              ))}
              {deliveries.map((delivery, idx) => (
                <span
                  key={delivery.id ?? `delivery-${idx}`}
                  className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning-soft px-1.5 py-0.5 text-xs text-warning-soft-foreground"
                >
                  <Truck className="h-3 w-3" />
                  {copy.format.deliveryAtStop(
                    getStopLabelForCargo(delivery.stopIndex, orderedStops),
                    delivery.weight != null
                      ? copy.format.weightSuffix(delivery.weight)
                      : undefined,
                    delivery.units != null
                      ? copy.format.unitsSuffix(delivery.units)
                      : undefined,
                  )}
                </span>
              ))}
            </div>
          ) : null}

          {cargo.notes ? (
            <p className="text-xs italic text-muted-foreground">{cargo.notes}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end lg:shrink-0 lg:pl-2">
        {emphasizeDeclaredValue &&
        cargo.declaredValue != null &&
        cargo.declaredValue > 0 ? (
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">{copy.label.declaredValue}</p>
            <p className="text-base font-semibold tabular-nums">
              {formatCurrency(cargo.declaredValue)}
            </p>
          </div>
        ) : null}
        {canDeliver ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onDeliverCargo(cargo.id)}
            disabled={isDeliverPending}
          >
            {isDeliverPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1 h-4 w-4" />
            )}
            {copy.action.deliver}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
