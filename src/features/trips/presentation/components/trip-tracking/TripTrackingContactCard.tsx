import { Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import type { TrackingContactInfo } from "./TripTrackingObjectiveHub";
import { trackingCopy } from "./trackingCopy";

export type TripTrackingContactCardProps = {
  contact?: TrackingContactInfo | null;
  className?: string;
};

/**
 * Card Contacto del artboard Seguimiento (operador / celular+Llamar / unidad).
 * Datos ya resueltos en el detalle de viaje — sin fetch extra.
 */
export function TripTrackingContactCard({
  contact = null,
  className,
}: TripTrackingContactCardProps) {
  const driverName = contact?.driverName?.trim() || null;
  const vehicleLabel = contact?.vehicleLabel?.trim() || null;
  const driverPhone = contact?.driverPhone?.trim() || null;

  return (
    <Card
      className={cn(className)}
      data-tracking-section="contact"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{trackingCopy.section.contact}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{trackingCopy.label.operator}</dt>
          <dd className="min-w-0 truncate font-medium">
            {driverName ?? "—"}
          </dd>

          <dt className="text-muted-foreground">{trackingCopy.label.mobile}</dt>
          <dd className="min-w-0">
            {driverPhone ? (
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-mono tabular-nums">{driverPhone}</span>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <a
                  href={`tel:${driverPhone}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {trackingCopy.action.call}
                </a>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {trackingCopy.label.mobileNotCaptured}
              </span>
            )}
          </dd>

          <dt className="text-muted-foreground">{trackingCopy.label.unit}</dt>
          <dd className="min-w-0 truncate font-medium">
            {vehicleLabel ?? "—"}
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}
