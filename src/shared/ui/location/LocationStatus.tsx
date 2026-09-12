import { Badge } from "@shared/ui/badge";
import {
  getGeocodingAccuracyBadgeVariant,
  getGeocodingAccuracyLabel,
  type GeocodingAccuracy,
} from "@shared/location/geocodingAccuracy";
import { cn } from "@shared/lib/utils/cn";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type { LocationContext } from "./LocationField.types";

export interface LocationStatusProps {
  geocodingAccuracy?: GeocodingAccuracy | null;
  isCartaPorteReady?: boolean;
  showCartaPorte?: boolean;
  /**
   * Fiscal = domicilio de facturación / emisor (fuera del complemento CP).
   * Operational contexts keep Carta Porte wording.
   */
  context?: LocationContext;
  className?: string;
}

function readinessLabels(context: LocationContext | undefined) {
  if (context === "fiscal") {
    return {
      ready: LOCATION_FIELD_COPY.fiscalReady,
      notReady: LOCATION_FIELD_COPY.fiscalNotReady,
    };
  }
  return {
    ready: LOCATION_FIELD_COPY.cartaPorteReady,
    notReady: LOCATION_FIELD_COPY.cartaPorteNotReady,
  };
}

export function LocationStatus({
  geocodingAccuracy,
  isCartaPorteReady,
  showCartaPorte = false,
  context,
  className,
}: LocationStatusProps) {
  const accuracyLabel = getGeocodingAccuracyLabel(geocodingAccuracy);
  const accuracyVariant = getGeocodingAccuracyBadgeVariant(geocodingAccuracy);
  const labels = readinessLabels(context);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {accuracyLabel ? (
        <Badge variant={accuracyVariant} tone="soft">
          {accuracyLabel}
        </Badge>
      ) : null}
      {showCartaPorte ? (
        <Badge
          variant={isCartaPorteReady ? "success" : "warning"}
          tone="soft"
        >
          {isCartaPorteReady ? labels.ready : labels.notReady}
        </Badge>
      ) : null}
    </div>
  );
}
