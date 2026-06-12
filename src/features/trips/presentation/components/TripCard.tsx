/**
 * TripCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta de listado alineada al patrón de VehicleCard:
 * cabecera con icono + título/subtítulo, rejilla de hechos, footer con estado y "Ver más".
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { TripStatus, type TripListItem } from "@features/trips/domain";
import { canDeleteTrip, canEditTrip } from "../../domain/rules";
import { TripListRouteLabel } from "./TripListRouteLabel";
import {
  MoreVertical,
  Calendar,
  Truck,
  User,
  XCircle,
  Pencil,
  Trash2,
  Eye,
  Navigation,
  Receipt,
} from "lucide-react";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { formatDateTime } from "@shared/utils/dateUtils";
import { getTripInvoicingBadgeConfig } from "../uiHelpers";

interface TripCardProps {
  trip: TripListItem;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export const TripCard = memo(function TripCard({
  trip,
  onView,
  onEdit,
  onDelete,
  onCancel,
  isSelected,
  onSelect,
  className,
}: TripCardProps) {
  const canEdit = canEditTrip(trip.status);
  const canDelete = canDeleteTrip(trip.status);
  const canCancel =
    trip.status === TripStatus.SCHEDULED ||
    trip.status === TripStatus.IN_PROGRESS;

  const invoicingConfig = getTripInvoicingBadgeConfig({
    status: trip.status,
    invoicing: trip.invoicing,
  });

  const handleCardClick = () => {
    onView?.(trip.id);
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary",
        className,
      )}
      onClick={handleCardClick}
    >
      {onSelect ? (
        <div
          className="absolute top-3 left-3 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(trip.id)}
            className="h-4 w-4 rounded border-border"
          />
        </div>
      ) : null}

      <CardHeader className={cn("pb-3", onSelect && "pl-10")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold leading-none">
                {trip.tripCode}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {trip.client?.legalName ?? "Sin cliente"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(trip.id);
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> Ver detalles
              </DropdownMenuItem>
              {canEdit && onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(trip.id);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canCancel && onCancel && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(trip.id);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4 text-warning" /> Cancelar
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(trip.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <TripListRouteLabel
          trip={trip}
          className="mb-3 text-sm leading-snug text-muted-foreground"
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {formatDateTime(trip.scheduledDeparture.toISOString())}
            </span>
          </div>
          {trip.vehicle ? (
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span className="truncate font-mono">{trip.vehicle.licensePlate}</span>
            </div>
          ) : null}
          {trip.driver ? (
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{trip.driver.fullName}</span>
            </div>
          ) : null}
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Receipt className="h-4 w-4 shrink-0" />
            <Badge variant={invoicingConfig.variant} className="text-xs font-normal">
              {invoicingConfig.label}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <TripStatusBadge status={trip.status} size="sm" showIcon={true} />
            {trip.requiresFiscalAttention ? (
              <Badge variant="destructive" className="text-xs">
                Fiscal
              </Badge>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(trip.id);
            }}
          >
            Ver más
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});

export function TripCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="mb-3 h-4 w-full max-w-[14rem] animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <div className="flex w-full items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardFooter>
    </Card>
  );
}
