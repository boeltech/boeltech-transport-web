/**
 * TripCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta de listado: EntityListCard + menú ⋯ vía TripActions (usable sin hover — D4/D5).
 * F11: hereda copy de facturación/estado + regla Ingreso (`finance.read`).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { TripListItem } from "@features/trips/domain";
import { TripListRouteLabel } from "./TripListRouteLabel";
import { TripActions } from "./TripActions";
import {
  Calendar,
  Truck,
  User,
  Eye,
  Navigation,
  Receipt,
  Clock,
} from "lucide-react";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { tripsListCopy } from "../copy/listCopy";
import {
  formatTripListClientSecondary,
  formatTripListDeparture,
  getTripListInvoicingAppearance,
  resolveTripListStatusSecondary,
  tripListIncomeValue,
} from "../helpers/tripListDisplay";

interface TripCardProps {
  trip: TripListItem;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
  /** Portal cliente: no enfatiza el nombre del cliente (siempre el mismo). */
  hideClient?: boolean;
}

export const TripCard = memo(function TripCard({
  trip,
  onView,
  onDelete,
  onCancel,
  isSelected,
  onSelect,
  className,
  hideClient = false,
}: TripCardProps) {
  const { hasPermission } = usePermissions();
  const showIncome = hasPermission("finance", "read");
  const income = showIncome ? tripListIncomeValue(trip.baseRate) : null;
  const invoicing = getTripListInvoicingAppearance(trip);
  const statusSecondary = resolveTripListStatusSecondary(trip);

  const handleCardClick = () => {
    onView?.(trip.id);
  };

  return (
    <EntityListCard
      className={cn(
        "relative",
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
              <h3 className="truncate font-mono text-lg font-semibold leading-none">
                {trip.tripCode}
              </h3>
              {!hideClient ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {formatTripListClientSecondary(trip)}
                </p>
              ) : null}
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <TripActions
              trip={trip}
              variant="dropdown"
              onView={onView}
              onDelete={onDelete}
              onCancel={onCancel}
              menuTriggerClassName={entityListCardMenuTriggerClassName}
              menuAriaLabel={tripsListCopy.card.actionsAria}
            />
          </div>
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
              {formatTripListDeparture(trip.scheduledDeparture)}
            </span>
          </div>
          {trip.vehicle?.unitNumber ? (
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">
                <span className="text-foreground">
                  {trip.vehicle.unitNumber}
                </span>
                {trip.vehicle.licensePlate ? (
                  <span
                    className="ml-1 font-mono text-xs"
                    title={trip.vehicle.licensePlate}
                  >
                    ({trip.vehicle.licensePlate})
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}
          {trip.driver?.fullName ? (
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{trip.driver.fullName}</span>
            </div>
          ) : null}
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Receipt className="h-4 w-4 shrink-0" />
            {invoicing.mode === "empty" ? (
              <span>{tripsListCopy.columns.emptyCell}</span>
            ) : invoicing.mode === "quiet" ? (
              <span className="text-xs">{invoicing.label}</span>
            ) : (
              <Badge
                variant={invoicing.variant}
                tone={invoicing.tone ?? "soft"}
                className="text-xs font-normal"
              >
                {invoicing.label}
              </Badge>
            )}
          </div>
          {showIncome ? (
            <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 border-t pt-2 text-sm">
              <span className="text-muted-foreground">
                {tripsListCopy.columns.income}
              </span>
              <span className="font-mono tabular-nums">
                {income != null
                  ? formatMxCurrency(income)
                  : tripsListCopy.columns.emptyCell}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <TripStatusBadge status={trip.status} size="sm" showIcon={false} />
            {statusSecondary ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  statusSecondary.tone === "late"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {statusSecondary.tone === "late" ? (
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                ) : null}
                {statusSecondary.text}
              </span>
            ) : null}
            {trip.requiresFiscalAttention ? (
              <Badge variant="destructive" tone="soft" className="text-xs">
                {tripsListCopy.badge.fiscalAttention}
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
            {tripsListCopy.actions.viewMore}
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </EntityListCard>
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
