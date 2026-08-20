import {
  AlertTriangle,
  Box,
  Building2,
  Edit2,
  Package,
  Scale,
  Trash2,
  Truck,
} from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  type CargoStatusType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import {
  formatCargoRouteLine,
  getCargoWeightKg,
  isCargoHazmat,
  isCargoInsured,
} from "./tripCargoDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

export interface TripDetailCargoItemCardProps {
  cargo: TripCargo;
  orderedStops: TripStop[];
  formatCurrency: (amount: number) => string;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  showClient?: boolean;
  emphasizeDeclaredValue?: boolean;
  className?: string;
  onEdit?: (cargoId: string) => void;
  onRemove?: (cargoId: string) => void;
}

/** @deprecated Prefer master-detail panel (`TripDetailCargoMasterDetail`). */
export function TripDetailCargoItemCard({
  cargo,
  orderedStops,
  formatCurrency,
  getCargoStatusVariant,
  showClient = false,
  emphasizeDeclaredValue = false,
  className,
  onEdit,
  onRemove,
}: TripDetailCargoItemCardProps) {
  const isHazmat = isCargoHazmat(cargo);
  const weightKg = getCargoWeightKg(cargo);
  const insured = isCargoInsured(cargo);
  const routeLine = formatCargoRouteLine(cargo, orderedStops);

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

          <p className="text-xs text-muted-foreground">{routeLine}</p>

          <div className="flex flex-wrap gap-1.5">
            {isHazmat ? (
              <span className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning-soft px-1.5 py-0.5 text-xs text-warning-soft-foreground">
                <AlertTriangle className="h-3 w-3" />
                {copy.label.hazardous}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {weightKg > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {copy.format.weightKg(weightKg)}
              </span>
            ) : null}
            {cargo.units ? (
              <span className="inline-flex items-center gap-1">
                <Box className="h-3 w-3" />
                {copy.format.unitsCount(cargo.units)}
              </span>
            ) : null}
            {cargo.volume ? (
              <span>
                {copy.label.volume}: {copy.format.volume(cargo.volume)}
              </span>
            ) : null}
            {insured &&
            cargo.declaredValue &&
            !emphasizeDeclaredValue ? (
              <span>
                {copy.label.insuranceValue}:{" "}
                {formatCurrency(cargo.declaredValue)}
              </span>
            ) : null}
          </div>

          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="h-3 w-3" />
            {copy.hint.manageInTracking}
          </p>

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
            <p className="text-xs text-muted-foreground">
              {copy.label.insuranceValue}
            </p>
            <p className="text-base font-semibold tabular-nums">
              {formatCurrency(cargo.declaredValue)}
            </p>
          </div>
        ) : null}
        {onEdit || onRemove ? (
          <div className="flex shrink-0 gap-1">
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(cargo.id)}
                aria-label={copy.action.editCargo}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemove(cargo.id)}
                aria-label={copy.action.removeCargo}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
