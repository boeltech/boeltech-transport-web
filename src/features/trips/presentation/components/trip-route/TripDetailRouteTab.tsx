import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Flag,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";

import {
  StopType,
  type Trip,
  type TripStatusType,
  type TripStop,
  type TripCargo,
} from "@features/trips/domain";
import { formatTripRouteSubtitle } from "@features/trips/presentation/uiHelpers";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { Separator } from "@shared/ui/separator";
import { cn } from "@shared/lib/utils/cn";

import { TripDetailRouteStopCard } from "./TripDetailRouteStopCard";
import { useTripFiscalSheets } from "../trip-fiscal";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import {
  countStopsMissingFiscalRfc,
  countStopsMissingSegmentDistance,
  groupStopsForRouteDetail,
  hasStopType,
  sumRouteSegmentDistanceKm,
} from "./tripRouteDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

export interface TripDetailRouteTabProps {
  trip: Trip;
  tripStatus: TripStatusType;
  orderedStops: TripStop[];
  progress: number;
  canEditStructural: boolean;
  cargos?: TripCargo[];
  legacyRoute?: {
    originCity?: string | null;
    originState?: string | null;
    destinationCity?: string | null;
    destinationState?: string | null;
  };
}

function getDisplayOrder(stop: TripStop, ordered: readonly TripStop[]): number {
  const index = ordered.findIndex((item) => item.id === stop.id);
  return index >= 0 ? index + 1 : stop.sequenceOrder;
}

function RouteSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function renderRouteStopCard(
  stop: TripStop,
  ordered: readonly TripStop[],
  tripStatus: TripStatusType,
  tripTimes: { scheduledDeparture: Date; actualDeparture: Date | null },
  showFiscalWarning: (stop: TripStop) => boolean,
  showFiscalCorrection: (stop: TripStop) => boolean,
  onFixFiscal: (stopId: string) => void,
) {
  const warning = showFiscalWarning(stop);
  const correction = !warning && showFiscalCorrection(stop);

  return (
    <TripDetailRouteStopCard
      stop={stop}
      displayOrder={getDisplayOrder(stop, ordered)}
      tripStatus={tripStatus}
      tripTimes={tripTimes}
      fiscalWarning={
        warning
          ? {
              show: true,
              label: tripFiscalCopy.chip.invalidRfc,
              onFix: () => onFixFiscal(stop.id),
            }
          : undefined
      }
      fiscalCorrection={
        correction
          ? { show: true, onFix: () => onFixFiscal(stop.id) }
          : undefined
      }
    />
  );
}

export function TripDetailRouteTab({
  trip,
  tripStatus,
  orderedStops,
  canEditStructural,
  legacyRoute,
}: TripDetailRouteTabProps) {
  const fiscal = useTripFiscalSheets({ trip, enableAutoRestamp: false });

  if (orderedStops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Navigation className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">{copy.state.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.state.emptyDescription}
          </p>
          {canEditStructural ? (
            <Button variant="outline" className="mt-5" asChild>
              <Link to={`/trips/${trip.id}/edit`}>{copy.action.replanRoute}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const { origin, destination, waypoints, ordered } =
    groupStopsForRouteDetail(orderedStops);
  const routeSubtitle = formatTripRouteSubtitle(ordered, legacyRoute ?? {});
  const totalSegmentKm = sumRouteSegmentDistanceKm(ordered);
  const missingDistanceCount = countStopsMissingSegmentDistance(ordered);
  const missingRfcCount = countStopsMissingFiscalRfc(ordered);
  const tripTimes = {
    scheduledDeparture: trip.scheduledDeparture,
    actualDeparture: trip.actualDeparture,
  };
  const pickupCount = ordered.filter((stop) =>
    hasStopType(stop.stopType, StopType.PICKUP),
  ).length;
  const deliveryCount = ordered.filter((stop) =>
    hasStopType(stop.stopType, StopType.DELIVERY),
  ).length;

  const showFiscalWarning = fiscal.shouldShowFiscalWarningChipForStop;
  const showFiscalCorrection = fiscal.shouldShowFiscalCorrectionChipForStop;
  const onFixFiscal = (stopId: string) => {
    fiscal.openFixSheet(stopId, {
      submitLabel: tripFiscalCopy.fixSheet.submitSave,
      pendingInvoiceId: null,
    });
  };

  const routeSummaryCard = (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.summary}
            </CardTitle>
            <CardDescription className="mt-1.5">
              {routeSubtitle !== "—" ? routeSubtitle : copy.hint.summaryFallback}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEditStructural ? (
              <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                <Link to={`/trips/${trip.id}/edit`}>{copy.action.openFullEdit}</Link>
              </Button>
            ) : null}
            <Badge variant="secondary" className="w-fit shrink-0 text-xs">
              {copy.format.stopCount(ordered.length)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {copy.label.segmentDistance}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
            {totalSegmentKm != null
              ? `${totalSegmentKm.toLocaleString("es-MX")} km`
              : "—"}
          </p>
        </div>
        <Separator />
        <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-3 text-sm">
          <InfoRow variant="inline" label={copy.label.pickups} value={pickupCount} />
          <InfoRow variant="inline" label={copy.label.deliveries} value={deliveryCount} />
          <InfoRow variant="inline" label={copy.label.waypoints} value={waypoints.length} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {!origin || !destination ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
            title={copy.alert.incompleteRoute}
            items={[
              ...(!origin ? [{ text: copy.alert.missingOrigin }] : []),
              ...(!destination ? [{ text: copy.alert.missingDestination }] : []),
            ]}
          />
        ) : null}

        {missingRfcCount > 0 ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
            title={copy.alert.missingAddressTitle}
            items={[{ text: copy.alert.missingAddressBody(missingRfcCount) }]}
          />
        ) : null}

        {missingDistanceCount > 0 ? (
          <DetailAlertCard
            severity="info"
            icon={<Route className="h-4 w-4" />}
            title={copy.alert.segmentDistanceTitle}
            items={[
              { text: copy.alert.missingSegmentBody(missingDistanceCount) },
              ...(canEditStructural
                ? [{ text: copy.hint.quickEditDistance }]
                : []),
            ]}
          />
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.stops}
            </CardTitle>
            <CardDescription>{copy.hint.stops}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <RouteSection
              title={copy.section.origin}
              icon={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
                  <Navigation className="h-4 w-4" />
                </span>
              }
            >
              {origin ? (
                renderRouteStopCard(
                  origin,
                  ordered,
                  tripStatus,
                  tripTimes,
                  showFiscalWarning,
                  showFiscalCorrection,
                  onFixFiscal,
                )
              ) : (
                <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {copy.state.noOrigin}
                </p>
              )}
            </RouteSection>

            {waypoints.length > 0 ? (
              <RouteSection
                title={`${copy.section.waypoints} (${copy.format.stopCount(waypoints.length)})`}
                icon={
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </span>
                }
              >
                <div className="space-y-3">
                  {waypoints.map((stop) => (
                    <div key={stop.id}>
                      {renderRouteStopCard(
                        stop,
                        ordered,
                        tripStatus,
                        tripTimes,
                        showFiscalWarning,
                        showFiscalCorrection,
                        onFixFiscal,
                      )}
                    </div>
                  ))}
                </div>
              </RouteSection>
            ) : null}

            <RouteSection
              title={copy.section.destination}
              icon={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive-soft text-destructive-soft-foreground">
                  <Flag className="h-4 w-4" />
                </span>
              }
            >
              {destination ? (
                renderRouteStopCard(
                  destination,
                  ordered,
                  tripStatus,
                  tripTimes,
                  showFiscalWarning,
                  showFiscalCorrection,
                  onFixFiscal,
                )
              ) : (
                <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {copy.state.noDestination}
                </p>
              )}
            </RouteSection>
          </CardContent>
        </Card>
      </div>

      <div className="order-first space-y-6 xl:order-none xl:sticky xl:top-24 xl:self-start">
        {routeSummaryCard}
      </div>

      {fiscal.sheets}
    </div>
  );
}
