/**
 * VehicleCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta para mostrar información resumida de un vehículo.
 * Usado en la vista de cards del listado.
 * Menú ⋯ vía EntityListCard (usable sin hover — D4).
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleCard.tsx
 */

import { CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import {
  Truck,
  MoreVertical,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
  Gauge,
  Calendar,
  CreditCard,
} from "lucide-react";
import type { VehicleListItem } from "../../domain";
import { VEHICLE_TYPE_LABELS, VehicleStatus } from "../../domain";
import {
  VehicleLifecycleBadge,
  VehicleStatusBadge,
} from "../config/vehicleStatusConfig";
import { vehiclesCopy } from "../copy";

const formatMileage = vehiclesCopy.detail.format.statMileage;
const cardCopy = vehiclesCopy.list.card;

// ============================================================================
// TYPES
// ============================================================================

interface VehicleCardProps {
  vehicle: VehicleListItem;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onRestore?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onDeactivate,
  onRestore,
}: VehicleCardProps) {
  const isInactive = vehicle.isActive === false;
  const editAction = isInactive ? undefined : onEdit;
  const deactivateAction =
    isInactive || vehicle.status === VehicleStatus.ON_TRIP
      ? undefined
      : onDeactivate;
  const restoreAction = isInactive ? onRestore : undefined;
  const hasActions = editAction || deactivateAction || restoreAction;

  return (
    <EntityListCard onClick={() => onView(vehicle.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Vehicle Icon & Unit Number */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">
                {vehicle.unitNumber}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
          </div>

          {/* Actions Menu — visible en touch sin hover (EntityListCard) */}
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={entityListCardMenuTriggerClassName}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{cardCopy.actionsAria}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(vehicle.id);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {vehiclesCopy.lifecycle.viewDetail}
                </DropdownMenuItem>
                {editAction && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      editAction(vehicle.id);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {restoreAction && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreAction(vehicle.id);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {vehiclesCopy.restore.action}
                  </DropdownMenuItem>
                )}
                {deactivateAction && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deactivateAction(vehicle.id);
                      }}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {vehiclesCopy.deactivate.action}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Type */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {VEHICLE_TYPE_LABELS[vehicle.type]}
            </span>
          </div>

          {/* Year */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{vehicle.year}</span>
          </div>

          {/* License Plate */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="font-mono">{vehicle.licensePlate}</span>
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4 shrink-0" />
            <span>{formatMileage(vehicle.currentMileage)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          {isInactive ? (
            <VehicleLifecycleBadge status="deactivated" size="sm" showIcon />
          ) : (
            <VehicleStatusBadge
              status={vehicle.status}
              size="sm"
              showIcon={true}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(vehicle.id);
            }}
          >
            {cardCopy.viewMore}
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </EntityListCard>
  );
}
