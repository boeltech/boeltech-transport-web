import { Flag, MapPin, Navigation, Package } from "lucide-react";

import type {
  CargoStatusType,
  StopTypeValue,
  TripCargo,
  TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { TripDetailCargoItemCard } from "./TripDetailCargoItemCard";
import { getStopDisplayOrder } from "./tripCargoDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

export interface TripDetailPickupGroup {
  stop: TripStop;
  items: TripCargo[];
}

export interface TripDetailCargoByPickupViewProps {
  groups: TripDetailPickupGroup[];
  orderedStops: TripStop[];
  formatCurrency: (amount: number) => string;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
}

type PickupCategory = "origin" | "waypoint" | "destination";

function hasStopType(
  stopType: TripStop["stopType"],
  target: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(target);
}

function getPickupCategory(stop: TripStop): PickupCategory {
  if (hasStopType(stop.stopType, "origin")) return "origin";
  if (hasStopType(stop.stopType, "destination")) return "destination";
  return "waypoint";
}

function categoryBadgeClass(category: PickupCategory): string {
  if (category === "origin") {
    return "bg-success-soft text-success-soft-foreground";
  }
  if (category === "destination") {
    return "bg-destructive-soft text-destructive-soft-foreground";
  }
  return "bg-muted text-muted-foreground";
}

function categoryIconClass(category: PickupCategory): string {
  if (category === "origin") {
    return "bg-success-soft text-success-soft-foreground";
  }
  if (category === "destination") {
    return "bg-destructive-soft text-destructive-soft-foreground";
  }
  return "bg-muted text-muted-foreground";
}

function categoryBorderClass(
  category: PickupCategory,
  hasMissing: boolean,
): string {
  if (hasMissing) return "border-warning/30";
  if (category === "origin") return "border-success/30";
  if (category === "destination") return "border-destructive/30";
  return "";
}

function categoryLabel(category: PickupCategory): string {
  if (category === "origin") return copy.label.origin;
  if (category === "destination") return copy.label.destination;
  return copy.label.waypoint;
}

export function TripDetailCargoByPickupView({
  groups,
  orderedStops,
  formatCurrency,
  getCargoStatusVariant,
}: TripDetailCargoByPickupViewProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        {copy.state.noPickupStops}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(({ stop, items }) => {
        const category = getPickupCategory(stop);
        const hasMissing = items.length === 0;
        const StopIcon =
          category === "origin"
            ? Navigation
            : category === "destination"
              ? Flag
              : MapPin;

        return (
          <Card
            key={stop.id}
            className={cn(categoryBorderClass(category, hasMissing))}
          >
            <CardHeader className="pb-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    categoryIconClass(category),
                  )}
                >
                  <StopIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      {copy.format.stopNumber(
                        getStopDisplayOrder(stop, orderedStops),
                      )}
                    </CardTitle>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        categoryBadgeClass(category),
                      )}
                    >
                      {categoryLabel(category)}
                    </span>
                    <span className="rounded bg-info-soft px-2 py-0.5 text-xs font-medium text-info-soft-foreground">
                      {copy.label.pickupOperation}
                    </span>
                    {hasMissing ? (
                      <span className="rounded bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-soft-foreground">
                        {copy.label.noMerchandise}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {stop.locationName || stop.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stop.city}
                    {stop.state ? `, ${stop.state}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {copy.format.merchandiseCount(items.length)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {hasMissing ? (
                <div className="rounded-lg border border-dashed border-warning/30 bg-warning-soft/30 py-6 text-center text-muted-foreground">
                  <Package className="mx-auto mb-1 h-8 w-8 opacity-40" />
                  <p className="text-sm">{copy.state.emptyAtStopTitle}</p>
                  <p className="mt-0.5 text-xs">{copy.state.emptyAtStopHint}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((cargo) => (
                    <TripDetailCargoItemCard
                      key={cargo.id}
                      cargo={cargo}
                      orderedStops={orderedStops}
                      formatCurrency={formatCurrency}
                      getCargoStatusVariant={getCargoStatusVariant}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
