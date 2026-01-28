/**
 * TripCard Component
 * Clean Architecture - Presentation Layer
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { TripStatusBadgeAnimated } from "./TripStatusBadge";
import { TripStatus, type Trip } from "@features/trips/domain";
import { canDeleteTrip, canEditTrip } from "../../domain/rules";
import { formatDisplayDate } from "../uiHelpers";
import {
  MoreVertical,
  MapPin,
  Calendar,
  Truck,
  User,
  Building2,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

interface TripCardProps {
  trip: Trip;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStart?: (id: string) => void;
  onFinish?: (id: string) => void;
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
  onStart,
  onFinish,
  onCancel,
  isSelected,
  onSelect,
  className,
}: TripCardProps) {
  const canEdit = canEditTrip(trip.status);
  const canDelete = canDeleteTrip(trip.status);
  const canStart = trip.status === TripStatus.SCHEDULED;
  const canFinish = trip.status === TripStatus.IN_PROGRESS;
  const canCancel =
    trip.status === TripStatus.SCHEDULED ||
    trip.status === TripStatus.IN_PROGRESS;

  const originCity = trip.stops?.[0]?.city || "Origen";
  const destCity = trip.stops?.[trip.stops.length - 1]?.city || "Destino";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        isSelected && "ring-2 ring-primary border-primary",
        className,
      )}
    >
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(trip.id)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      )}

      <CardHeader className={cn("pb-3", onSelect && "pl-10")}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/trips/${trip.id}`}
                className="font-semibold text-lg hover:text-primary transition-colors truncate"
              >
                {trip.tripCode}
              </Link>
              <TripStatusBadgeAnimated status={trip.status} size="sm" />
            </div>
            {trip.client && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{trip.client.legalName}</span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(trip.id)}>
                <Eye className="mr-2 h-4 w-4" /> Ver detalles
              </DropdownMenuItem>
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(trip.id)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canStart && onStart && (
                <DropdownMenuItem onClick={() => onStart(trip.id)}>
                  <Play className="mr-2 h-4 w-4 text-amber-500" /> Iniciar
                </DropdownMenuItem>
              )}
              {canFinish && onFinish && (
                <DropdownMenuItem onClick={() => onFinish(trip.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />{" "}
                  Finalizar
                </DropdownMenuItem>
              )}
              {canCancel && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(trip.id)}>
                  <XCircle className="mr-2 h-4 w-4 text-amber-600" /> Cancelar
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(trip.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            <span className="truncate max-w-[100px]">{originCity}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            <span className="truncate max-w-[100px]">{destCity}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {/* {formatDisplayDate(trip.scheduledDeparture, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} */}
              {formatDisplayDate(trip.scheduledDeparture)}
            </span>
          </div>
          {trip.vehicle && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              <span>{trip.vehicle.licensePlate}</span>
            </div>
          )}
          {trip.driver && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{trip.driver.fullName}</span>
            </div>
          )}
        </div>
      </CardContent>

      <Link to={`/trips/${trip.id}`} className="absolute inset-0 z-0" />
    </Card>
  );
});

export function TripCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
