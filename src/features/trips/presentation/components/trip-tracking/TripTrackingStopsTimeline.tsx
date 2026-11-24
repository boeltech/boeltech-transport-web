import { Package, Truck } from "lucide-react";

import {
  CargoStatus,
  CARGO_STATUS_LABELS,
  StopType,
  TripStatus,
  type CargoStatusType,
  type StopStatusValue,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import {
  getStopTypeBadgeClasses,
  getStopTypeConfig,
} from "@features/trips/presentation/uiHelpers";
import { formatStopTimelineLabel } from "../../uiHelpers";
import { tripDetailCopy } from "../../copy";
import {
  isCargoTerminal,
  resolveCargoActionTransitionHint,
  resolveCargoCtaLayout,
} from "../../utils/cargoStatusActions";
import { getStopCargoLinks } from "../../utils/stopCargoCorrelation";
import {
  canOperateCargoAtStop,
  getCargoBlockAtStop,
} from "../../utils/trackingCargoGating";
import {
  getRouteStopCategory,
  hasStopType,
} from "../trip-route/tripRouteDetailHelpers";
import { CargoActionInline } from "./CargoActionInline";
import {
  getCargoActionsForStopLink,
  type OnOperateCargoAction,
  type PendingOperateCargoAction,
} from "./operateCargoActions";
import { PlanReturnDestinationLock } from "./PlanReturnSheet";
import {
  resolveReturnedCargoBadge,
  resolveReturnStopLabelMap,
  resolveReturnStopVisitMap,
  resolvePlanReturnTargetCargo,
} from "./planReturnHelpers";
import {
  TrackingStopStatusBadgeRow,
  trackingStopStatusForBadge,
} from "./trackingStopStatusBadgeConfig";
import type { TrackingItineraryRow } from "./trackingOperationalHelpers";
import type { TrackingTrafficLight } from "./trackingTrafficLight";
import {
  trackingTrafficLightBadgeVariant,
  trackingTrafficLightLabel,
} from "./trackingTrafficLight";
import { trackingCopy } from "./trackingCopy";

const cargoCopy = tripDetailCopy.cargo;

export type TripTrackingStopsTimelineProps = {
  rows: readonly TrackingItineraryRow[];
  orderedStops: readonly TripStop[];
  tripStatus: TripStatusType;
  cargos?: readonly TripCargo[];
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  selectionHint?: string | null;
  trafficLight?: TrackingTrafficLight;
  /** Subtítulo artboard: ETA destino si aplica. */
  estimatedArrivalLabel?: string | null;
  onCargoAction?: OnOperateCargoAction;
  pendingCargoAction?: PendingOperateCargoAction | null;
  canMutateCargo?: boolean;
  /** F3b: GET `return_replan_required` — CTA Planear retorno bajo carga `returned`. */
  returnReplanRequired?: boolean;
  onPlanReturn?: () => void;
  getCargoStatusVariant?: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

function defaultCargoStatusVariant(
  _status: CargoStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  return "secondary";
}

/**
 * Timeline vertical de paradas (artboard Seguimiento).
 * Parada activa: bloque «Cargas en esta parada» + CTAs; sin inventar GPS.
 */
export function TripTrackingStopsTimeline({
  rows,
  orderedStops,
  tripStatus,
  cargos = [],
  selectedStopId = null,
  onSelectStop,
  selectionHint = null,
  trafficLight = "n/a",
  estimatedArrivalLabel = null,
  onCargoAction,
  pendingCargoAction = null,
  canMutateCargo = false,
  returnReplanRequired = false,
  onPlanReturn,
  getCargoStatusVariant = defaultCargoStatusVariant,
  className,
}: TripTrackingStopsTimelineProps) {
  const tripInProgress = tripStatus === TripStatus.IN_PROGRESS;
  const showHints = tripInProgress;
  const hint = selectionHint?.trim() || null;
  const completed = rows.filter((r) => r.visitState === "visited").length;
  const subtitle =
    rows.length === 0
      ? null
      : estimatedArrivalLabel
        ? `${trackingCopy.label.stopsProgress(completed, rows.length)} · ${estimatedArrivalLabel}`
        : trackingCopy.label.stopsProgress(completed, rows.length);

  if (rows.length === 0) {
    return (
      <Card
        className={cn(className)}
        data-tracking-section="stops-timeline"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {trackingCopy.section.itinerary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {trackingCopy.state.noStops}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("flex min-h-0 flex-col", className)}
      data-tracking-section="stops-timeline"
    >
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {trackingCopy.section.itinerary}
          {trafficLight !== "n/a" ? (
            <Badge
              variant={trackingTrafficLightBadgeVariant(trafficLight)}
              tone="soft"
              className="font-normal"
            >
              {trackingTrafficLightLabel(trafficLight)}
            </Badge>
          ) : null}
        </CardTitle>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardHeader>

      <CardContent className="min-h-0 flex-1 space-y-0 overflow-y-auto pb-2">
        <ol className="space-y-0">
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            return (
              <TripTrackingStopsTimelineItem
                key={row.stop.id}
                row={row}
                isLast={isLast}
                selected={selectedStopId === row.stop.id}
                showHints={showHints}
                tripInProgress={tripInProgress}
                tripStatus={tripStatus}
                orderedStops={orderedStops}
                cargos={cargos}
                interactive={onSelectStop != null}
                onSelect={onSelectStop}
                onCargoAction={onCargoAction}
                pendingCargoAction={pendingCargoAction}
                canMutateCargo={canMutateCargo}
                returnReplanRequired={returnReplanRequired}
                onPlanReturn={onPlanReturn}
                getCargoStatusVariant={getCargoStatusVariant}
              />
            );
          })}
        </ol>
        {hint ? (
          <p
            className="mt-3 text-xs text-muted-foreground"
            role="status"
            data-tracking-rail-hint="map-only"
          >
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

type TripTrackingStopsTimelineItemProps = {
  row: TrackingItineraryRow;
  isLast: boolean;
  selected: boolean;
  showHints: boolean;
  tripInProgress: boolean;
  tripStatus: TripStatusType;
  orderedStops: readonly TripStop[];
  cargos: readonly TripCargo[];
  interactive: boolean;
  onSelect?: (stopId: string) => void;
  onCargoAction?: OnOperateCargoAction;
  pendingCargoAction?: PendingOperateCargoAction | null;
  canMutateCargo: boolean;
  returnReplanRequired: boolean;
  onPlanReturn?: () => void;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
};

function TripTrackingStopsTimelineItem({
  row,
  isLast,
  selected,
  showHints,
  tripInProgress,
  tripStatus,
  orderedStops,
  cargos,
  interactive,
  onSelect,
  onCargoAction,
  pendingCargoAction,
  canMutateCargo,
  returnReplanRequired,
  onPlanReturn,
  getCargoStatusVariant,
}: TripTrackingStopsTimelineItemProps) {
  const { primary } = formatStopTimelineLabel(row.stop, row.displayOrder);
  const stopStatus = trackingStopStatusForBadge(
    row.stop.status as StopStatusValue | undefined,
  );
  const markerActive =
    row.visitState === "visited" || row.visitState === "at_stop";
  const showPickup = hasStopType(row.stop.stopType, StopType.PICKUP);
  const showDelivery = hasStopType(row.stop.stopType, StopType.DELIVERY);
  /** Artboard: anidar cargas solo en parada En sitio / en espera — no en destino pendiente. */
  const expandCargos =
    showHints && (row.visitState === "at_stop" || row.waitingPhase);
  const links = expandCargos
    ? getStopCargoLinks(row.stop, cargos, orderedStops)
    : [];
  const stopActive = canOperateCargoAtStop(row.stop, tripStatus);
  const cargoBlock = expandCargos
    ? getCargoBlockAtStop(row.stop, cargos, orderedStops)
    : { blocked: false, descriptions: [] as string[] };
  const cargoActionsEnabled =
    tripInProgress && stopActive && canMutateCargo && onCargoAction != null;
  const returnLabelMap = resolveReturnStopLabelMap(cargos, orderedStops);
  const returnVisitMap = resolveReturnStopVisitMap(cargos, orderedStops);
  const returnMeta = returnLabelMap.get(row.stop.id);
  const isDestinationStop = getRouteStopCategory(row.stop) === "destination";
  const planReturnTarget = returnReplanRequired
    ? resolvePlanReturnTargetCargo(cargos)
    : null;
  const showReturnLock =
    returnReplanRequired &&
    isDestinationStop &&
    planReturnTarget != null &&
    !returnMeta;

  return (
    <li className="relative">
      <div
        className={cn(
          "relative flex gap-3 rounded-lg px-1 py-3 transition-colors",
          selected && "bg-muted/40",
          row.isActionTarget && showHints && !selected
            ? "bg-primary/5"
            : null,
        )}
      >
        <div className="relative flex w-8 shrink-0 flex-col items-center">
          <button
            type="button"
            disabled={!interactive}
            aria-pressed={interactive ? selected : undefined}
            aria-label={primary}
            onClick={() => onSelect?.(row.stop.id)}
            className={cn(
              "z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              interactive ? "cursor-pointer" : "cursor-default",
              markerActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-background text-muted-foreground",
              row.isActionTarget && showHints
                ? "ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                : null,
            )}
          >
            {row.displayOrder}
          </button>
          {!isLast ? (
            <span
              className={cn(
                "absolute top-8 bottom-[-12px] w-0.5",
                markerActive ? "bg-primary/40" : "bg-border",
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelect?.(row.stop.id)}
              className={cn(
                "text-left text-sm font-semibold text-foreground",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                interactive ? "cursor-pointer" : "cursor-default",
              )}
            >
              {row.stop.locationName?.trim() || primary}
            </button>
            {showPickup ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                  getStopTypeBadgeClasses(StopType.PICKUP),
                )}
              >
                {getStopTypeConfig(StopType.PICKUP).label}
              </span>
            ) : null}
            {showDelivery ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                  getStopTypeBadgeClasses(StopType.DELIVERY),
                )}
              >
                {getStopTypeConfig(StopType.DELIVERY).label}
              </span>
            ) : null}
            {returnMeta ? (
              <Badge variant="info" tone="soft" className="text-[10px] font-normal">
                {trackingCopy.planReturnSheet.stopReturnLabel}
              </Badge>
            ) : null}
            <TrackingStopStatusBadgeRow
              status={stopStatus}
              isActive={row.isActionTarget && showHints}
            />
            {row.waitingPhase ? (
              <Badge
                variant="warning"
                tone="soft"
                className="text-[10px] font-normal"
              >
                {trackingCopy.label.waitingPhase}
              </Badge>
            ) : null}
          </div>
          {returnMeta ? (
            <p className="text-xs text-muted-foreground">
              {trackingCopy.planReturnSheet.stopReceives(
                returnMeta.cargo.description,
                trackingCopy.format.cargoFacts(
                  returnMeta.cargo.weightInKg ?? returnMeta.cargo.weight,
                  returnMeta.cargo.units,
                ) ?? "",
              )}
            </p>
          ) : null}
          {showReturnLock ? (
            <PlanReturnDestinationLock
              cargoName={planReturnTarget.description}
            />
          ) : null}

          {row.planRealLines.length > 0 ? (
            <ul className="space-y-0.5 text-xs tabular-nums text-muted-foreground">
              {row.planRealLines.map((line) => (
                <li key={line.kind}>{line.summary}</li>
              ))}
            </ul>
          ) : null}

          {expandCargos ? (
            <div
              className="mt-2 space-y-2 rounded-md border bg-muted/20 px-3 py-2.5"
              data-tracking-section="stop-cargos-nested"
            >
              <p className="text-xs font-semibold text-foreground">
                {trackingCopy.section.cargosAtStop}
              </p>
              {links.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {cargoCopy.state.emptyAtStopTitle}
                </p>
              ) : (
                <ul className="space-y-2">
                  {links.map((link) => {
                    const actions = getCargoActionsForStopLink(
                      link,
                      tripInProgress,
                      row.stop,
                      { returnVisitMap },
                    );
                    const terminal = isCargoTerminal(link.cargo.status);
                    const showCargoActions =
                      !terminal &&
                      actions.length > 0 &&
                      onCargoAction != null;
                    const sideBySide =
                      showCargoActions &&
                      resolveCargoCtaLayout(actions) === "side-by-side";
                    const showPlanReturnCta =
                      returnReplanRequired &&
                      link.cargo.status === CargoStatus.RETURNED &&
                      onPlanReturn != null;
                    const cargoFacts = trackingCopy.format.cargoFacts(
                      link.movement.weight ??
                        link.cargo.weightInKg ??
                        link.cargo.weight,
                      link.movement.units ?? link.cargo.units,
                    );
                    return (
                      <li
                        key={`${link.cargo.id}-${link.movement.id ?? link.movementType}`}
                        className={cn(
                          sideBySide
                            ? "flex items-start gap-2"
                            : "flex flex-col gap-2",
                          // L-D7: separador por ítem (paridad StopOperationDetail)
                          "rounded-md border bg-background/60 px-2.5 py-2",
                        )}
                        data-cargo-cta-layout={
                          sideBySide ? "side-by-side" : "stack"
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-1.5">
                            {link.movementType === "pickup" ? (
                              <Package
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info"
                                aria-hidden
                              />
                            ) : (
                              <Truck
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning"
                                aria-hidden
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p
                                className="line-clamp-2 break-words text-sm font-medium"
                                title={link.cargo.description}
                              >
                                {link.cargo.description}
                              </p>
                              {cargoFacts ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {cargoFacts}
                                </p>
                              ) : null}
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                {(() => {
                                  const returnedBadge =
                                    resolveReturnedCargoBadge({
                                      cargo: link.cargo,
                                      returnReplanRequired,
                                      orderedStops,
                                    });
                                  if (returnedBadge) {
                                    return (
                                      <Badge
                                        variant={returnedBadge.variant}
                                        tone={returnedBadge.tone}
                                        className="text-[10px] font-normal"
                                      >
                                        {returnedBadge.label}
                                      </Badge>
                                    );
                                  }
                                  return (
                                    <Badge
                                      variant={getCargoStatusVariant(
                                        link.cargo.status,
                                      )}
                                      className="text-[10px] font-normal"
                                    >
                                      {CARGO_STATUS_LABELS[link.cargo.status] ??
                                        link.cargo.status}
                                    </Badge>
                                  );
                                })()}
                                {link.movement.completedAt != null ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-normal"
                                  >
                                    {link.movementType === "pickup"
                                      ? cargoCopy.label.pickupCompleted
                                      : cargoCopy.label.deliveryCompleted}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                        {showCargoActions || showPlanReturnCta ? (
                          <div
                            className={cn(
                              "flex min-w-0 flex-col gap-1.5",
                              sideBySide ? "shrink-0" : "w-full",
                            )}
                          >
                            {showCargoActions ? (
                              <div
                                className={cn(
                                  "flex min-w-0 gap-2",
                                  sideBySide
                                    ? "flex-col"
                                    : "w-full flex-col sm:flex-row sm:flex-wrap",
                                )}
                              >
                                {actions.map((action) => {
                                  const hint = resolveCargoActionTransitionHint(
                                    action,
                                    row.stop,
                                  );
                                  return (
                                    <CargoActionInline
                                      key={action}
                                      action={action}
                                      size="sm"
                                      className={
                                        sideBySide
                                          ? "min-w-0"
                                          : "min-w-0 sm:max-w-sm"
                                      }
                                      showTransition={
                                        action === "return" ||
                                        action === "cancel"
                                      }
                                      transitionText={hint}
                                      pending={
                                        pendingCargoAction?.cargoId ===
                                          link.cargo.id &&
                                        pendingCargoAction.action === action &&
                                        (pendingCargoAction.movementId ==
                                          null ||
                                          pendingCargoAction.movementId ===
                                            link.movement.id)
                                      }
                                      disabled={!cargoActionsEnabled}
                                      title={
                                        !cargoActionsEnabled
                                          ? stopActive
                                            ? undefined
                                            : trackingCopy.hint
                                                .cargoActionRequiresArrival
                                          : undefined
                                      }
                                      onClick={() =>
                                        onCargoAction(
                                          link.cargo.id,
                                          action,
                                          link.movement.id,
                                        )
                                      }
                                    />
                                  );
                                })}
                              </div>
                            ) : null}
                            {showPlanReturnCta ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                className="h-auto min-h-8 justify-start py-1.5 text-xs"
                                onClick={onPlanReturn}
                                data-tracking-section="plan-return-cargo"
                              >
                                {trackingCopy.action.planReturn}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              {cargoBlock.blocked ? (
                <p className="text-xs text-muted-foreground">
                  {canMutateCargo
                    ? trackingCopy.hint.cargoBlockedBeforeDeparture
                    : trackingCopy.hint.cargoBlockedBeforeDepartureDriver}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
