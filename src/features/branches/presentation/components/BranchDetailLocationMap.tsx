import { lazy, Suspense } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { config } from "@shared/config";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { branchesCopy } from "../copy/branchesCopy";

const AddressGeolocationMap = lazy(() =>
  import("@shared/ui/address-input/AddressGeolocationMap").then((mod) => ({
    default: mod.AddressGeolocationMap,
  })),
);

const mapCopy = branchesCopy.detail.map;

export interface BranchDetailLocationMapProps {
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly geolocationPending?: boolean;
  readonly editHref?: string;
  readonly canEdit?: boolean;
}

function hasValidCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): boolean {
  return latitude != null && longitude != null;
}

function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function buildExternalMapUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function BranchDetailLocationMap({
  latitude,
  longitude,
  geolocationPending = false,
  editHref,
  canEdit = false,
}: BranchDetailLocationMapProps) {
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const hasCoordinates = hasValidCoordinates(latitude, longitude);

  if (
    !hasCoordinates ||
    geolocationPending ||
    latitude == null ||
    longitude == null
  ) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium">{mapCopy.title}</p>
        <div
          className={cn(
            "flex min-h-52 flex-col items-center justify-center gap-3 rounded-md border border-dashed",
            "bg-muted/30 px-4 py-6 text-center",
          )}
        >
          <MapPin className="h-8 w-8 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm text-foreground">{mapCopy.noCoordinates}</p>
            <p className="text-xs text-muted-foreground">
              {mapCopy.noCoordinatesHint}
            </p>
          </div>
          {canEdit && editHref ? (
            <Button asChild variant="outline" size="sm">
              <Link to={editHref}>{mapCopy.completeLocationCta}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const coordsLabel = formatCoordinates(latitude, longitude);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{mapCopy.title}</p>
        <Badge variant="secondary" tone="soft">
          {mapCopy.confirmedLabel}
        </Badge>
      </div>
      <p className="font-mono text-xs text-muted-foreground">{coordsLabel}</p>

      {mapboxToken ? (
        <Suspense
          fallback={
            <Skeleton
              className="h-52 w-full rounded-md"
              aria-label="Cargando mapa"
            />
          }
        >
          <AddressGeolocationMap
            token={mapboxToken}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={() => {}}
            disabled
            className="h-52"
          />
        </Suspense>
      ) : (
        <Alert variant="info">
          <AlertDescription>{mapCopy.noMapboxToken}</AlertDescription>
        </Alert>
      )}

      <a
        href={buildExternalMapUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
      >
        {mapCopy.openExternal}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
