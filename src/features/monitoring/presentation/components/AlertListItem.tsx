import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BatteryLow,
  CircleOff,
  Gauge,
  MapPin,
  PauseCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import type { GpsAlert, GpsAlertTypeCode } from "../../domain";
import { fleetMapFocusPath } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { formatAbsoluteTime } from "../utils/formatAbsoluteTime";
import { RelativeTime } from "./RelativeTime";

const TYPE_ICON: Record<
  GpsAlertTypeCode,
  ComponentType<{ className?: string }>
> = {
  overspeed: Gauge,
  long_stop: PauseCircle,
  signal_lost: CircleOff,
  low_battery: BatteryLow,
  geofence_exit: ShieldAlert,
};

export interface AlertListItemProps {
  readonly alert: GpsAlert;
  readonly onActivate?: (alert: GpsAlert) => void;
  readonly className?: string;
}

export function AlertListItem({
  alert,
  onActivate,
  className,
}: AlertListItemProps) {
  const copy = monitoringCopy.alerts;
  const Icon = TYPE_ICON[alert.alertType] ?? AlertTriangle;
  const unread = alert.readAt == null;
  const typeLabel = copy.types[alert.alertType] ?? alert.title;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between",
        unread && "border-destructive/30 bg-destructive/5",
        className,
      )}
      data-testid={`alert-list-item-${alert.id}`}
      data-unread={unread ? "true" : "false"}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 gap-3 text-left"
        onClick={() => onActivate?.(alert)}
      >
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            unread ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 space-y-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{alert.title}</span>
            {unread ? (
              <Badge variant="destructive" className="text-[10px]">
                {copy.unread}
              </Badge>
            ) : null}
          </span>
          <span className="block text-sm text-muted-foreground">
            {alert.vehicleEconomicNumber}
            {alert.vehiclePlate ? ` · ${alert.vehiclePlate}` : ""}
            {" · "}
            {typeLabel}
          </span>
          <span className="block text-sm text-foreground/90">
            {alert.description}
          </span>
          <span className="block text-xs text-muted-foreground">
            {formatAbsoluteTime(alert.occurredAt)}
            {" · "}
            <RelativeTime iso={alert.occurredAt} />
          </span>
        </span>
      </button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 self-start"
        asChild
      >
        <Link
          to={fleetMapFocusPath(alert.vehicleId)}
          onClick={() => onActivate?.(alert)}
        >
          <MapPin className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {copy.viewOnMap}
        </Link>
      </Button>
    </div>
  );
}
