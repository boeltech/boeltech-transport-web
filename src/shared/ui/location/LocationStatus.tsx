import { Badge } from "@shared/ui/badge";
import {
  getGeocodingAccuracyBadgeVariant,
  getGeocodingAccuracyLabel,
  type GeocodingAccuracy,
} from "@shared/location/geocodingAccuracy";
import { cn } from "@shared/lib/utils/cn";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";

export interface LocationStatusProps {
  geocodingAccuracy?: GeocodingAccuracy | null;
  isCartaPorteReady?: boolean;
  showCartaPorte?: boolean;
  className?: string;
}

export function LocationStatus({
  geocodingAccuracy,
  isCartaPorteReady,
  showCartaPorte = false,
  className,
}: LocationStatusProps) {
  const accuracyLabel = getGeocodingAccuracyLabel(geocodingAccuracy);
  const accuracyVariant = getGeocodingAccuracyBadgeVariant(geocodingAccuracy);

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
          {isCartaPorteReady
            ? LOCATION_FIELD_COPY.cartaPorteReady
            : LOCATION_FIELD_COPY.cartaPorteNotReady}
        </Badge>
      ) : null}
    </div>
  );
}
