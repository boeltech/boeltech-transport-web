import { isCartaPorteListBadgeReady } from "@boeltech/cfdi-domain";
import { MapPin } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import { formatLocationAddressSummary } from "./locationSearchCompositor";
import type {
  LocationCardVariant,
  LocationContext,
  LocationValue,
} from "./LocationField.types";
import { LocationStatus } from "./LocationStatus";

export interface LocationCardProps {
  value: LocationValue;
  variant?: LocationCardVariant;
  /** Drives readiness chip copy (fiscal ≠ Carta Porte). */
  context?: LocationContext;
  onChangeRequest?: () => void;
  onEditRequest?: () => void;
  showCartaPorteStatus?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Prefer API/catalog flag; if absent, derive list-badge readiness from SAT fields. */
function resolveReadiness(value: LocationValue): boolean {
  if (value.isCartaPorteReady != null) return value.isCartaPorteReady;
  return isCartaPorteListBadgeReady({
    sat_country_code: value.satCountryCode,
    sat_state_code: value.satStateCode,
    sat_municipality_code: value.satMunicipalityCode,
    postal_code: value.postalCode,
  });
}

export function LocationCard({
  value,
  variant = "default",
  context,
  onChangeRequest,
  onEditRequest,
  showCartaPorteStatus = false,
  disabled = false,
  className,
}: LocationCardProps) {
  const title =
    value.locationName?.trim() ||
    formatLocationAddressSummary(value) ||
    LOCATION_FIELD_COPY.searchPlaceholder;
  const summary = formatLocationAddressSummary(value);
  const showSummary = Boolean(summary) && summary !== title;
  const showDetails = variant === "detailed" || variant === "operational";
  const isCompact = variant === "compact";
  const isHero = variant === "default" || variant === "operational";

  return (
    <div
      data-testid="location-card"
      data-variant={variant}
      className={cn(
        "border border-border bg-card text-card-foreground shadow-sm",
        isHero ? "rounded-xl p-4" : "rounded-lg",
        isCompact ? "p-3" : !isHero && "p-4",
        className,
      )}
    >
      <div className={cn("flex gap-3", isCompact && "items-center")}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
            isCompact ? "size-8" : "size-10",
          )}
          aria-hidden
        >
          <MapPin className={isCompact ? "size-4" : "size-5"} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <p
                className={cn(
                  "truncate font-semibold text-foreground",
                  isCompact ? "text-sm font-medium" : "text-base",
                )}
              >
                {title}
              </p>
              {showSummary ? (
                <p className="truncate text-xs text-muted-foreground">
                  {summary}
                </p>
              ) : null}
            </div>
            <LocationStatus
              geocodingAccuracy={value.geocodingAccuracy}
              isCartaPorteReady={resolveReadiness(value)}
              showCartaPorte={showCartaPorteStatus}
              context={context}
            />
          </div>

          {showDetails ? (
            <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {value.postalCode ? (
                <div>
                  <dt className="inline font-medium text-foreground">
                    {LOCATION_FIELD_COPY.postalCodeShort}:{" "}
                  </dt>
                  <dd className="inline font-mono tabular-nums">
                    {value.postalCode}
                  </dd>
                </div>
              ) : null}
              {value.latitude != null && value.longitude != null ? (
                <div>
                  <dt className="inline font-medium text-foreground">
                    {LOCATION_FIELD_COPY.coordinatesLabel}:{" "}
                  </dt>
                  <dd className="inline font-mono tabular-nums">
                    {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                  </dd>
                </div>
              ) : (
                <div>{LOCATION_FIELD_COPY.noCoordinates}</div>
              )}
              {variant === "operational" && value.neighborhoodName ? (
                <div className="sm:col-span-2">
                  <dt className="inline font-medium text-foreground">
                    {LOCATION_FIELD_COPY.neighborhoodLabel}:{" "}
                  </dt>
                  <dd className="inline">{value.neighborhoodName}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {(onChangeRequest || onEditRequest) && !isCompact ? (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {onChangeRequest ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  aria-label={LOCATION_FIELD_COPY.changeAriaLabel}
                  onClick={onChangeRequest}
                >
                  {LOCATION_FIELD_COPY.change}
                </Button>
              ) : null}
              {onEditRequest ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  aria-label={LOCATION_FIELD_COPY.editAriaLabel}
                  onClick={onEditRequest}
                >
                  {LOCATION_FIELD_COPY.edit}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

