/**
 * VehicleCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta para mostrar información resumida de un vehículo.
 * Usado en la vista de cards del listado.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleCard.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  Truck,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Gauge,
  Calendar,
  CreditCard,
} from "lucide-react";
import type { VehicleListItem } from "../../domain";
import { VEHICLE_TYPE_LABELS } from "../../domain";
import { VehicleStatusBadge } from "../index";

// ============================================================================
// TYPES
// ============================================================================

interface VehicleCardProps {
  vehicle: VehicleListItem;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const hasActions = onEdit || onDelete;

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onView(vehicle.id)}
    >
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

          {/* Actions Menu */}
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
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
                  Ver detalles
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(vehicle.id);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(vehicle.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
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
            <span>{vehicle.currentMileage.toLocaleString("es-MX")} km</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <VehicleStatusBadge
            status={vehicle.status}
            size="sm"
            showIcon={true}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(vehicle.id);
            }}
          >
            Ver más
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
