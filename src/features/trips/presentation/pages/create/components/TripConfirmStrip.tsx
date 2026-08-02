/**
 * Franja de confirmación del paso Resumen (checkout del wizard).
 *
 * Sustituye el racimo de chips y la caja «Totales de carga»: una sola lectura
 * de quién, cuándo, ruta, mercancías y resultado estimado.
 */

import {
  AlertTriangle,
  CircleDollarSign,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import type { FinancialHealth } from "../../../components/trip-financial";
import { wizardCopy } from "../../../copy";

const copy = wizardCopy.summary;

export interface TripConfirmStripProps {
  clientLabel: string;
  tripTypeLabel: string;
  unitLabel: string;
  driverLabel: string;
  departureLabel: string;
  stopsLabel: string;
  merchandiseLabel: string;
  utilityLabel: string | null;
  health: FinancialHealth;
  hasHazmat: boolean;
  className?: string;
}

function healthClasses(health: FinancialHealth): {
  border: string;
  utility: string;
} {
  switch (health) {
    case "critical":
      return {
        border: "border-destructive/40",
        utility: "text-destructive",
      };
    case "warning":
      return {
        border: "border-warning/40",
        utility: "text-warning",
      };
    case "healthy":
      return {
        border: "border-success/40",
        utility: "text-success",
      };
    default:
      return {
        border: "",
        utility: "text-foreground",
      };
  }
}

export function TripConfirmStrip({
  clientLabel,
  tripTypeLabel,
  unitLabel,
  driverLabel,
  departureLabel,
  stopsLabel,
  merchandiseLabel,
  utilityLabel,
  health,
  hasHazmat,
  className,
}: TripConfirmStripProps) {
  const tone = healthClasses(health);

  return (
    <div
      className={cn(
        "sticky top-16 z-20 space-y-3 rounded-lg border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        tone.border,
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {clientLabel}
          </p>
          <p className="text-xs text-muted-foreground">{tripTypeLabel}</p>
        </div>
        {utilityLabel ? (
          <p
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums",
              tone.utility,
            )}
          >
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            {utilityLabel}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-foreground">{unitLabel}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-foreground">{driverLabel}</span>
        </span>
        <span className="truncate">{departureLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {stopsLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 shrink-0" />
          {merchandiseLabel}
        </span>
        {hasHazmat ? (
          <Badge variant="warning" tone="soft" className="gap-1 font-normal">
            <AlertTriangle className="h-3 w-3" />
            {copy.confirm.hazmat}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
