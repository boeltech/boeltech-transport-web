import { createElement, useId, useMemo } from "react";
import {
  Ban,
  CheckCircle2,
  Flag,
  MapPin,
  Navigation,
  Package,
  Send,
} from "lucide-react";

import {
  TripStatus,
  type CfdiEmissionIntent,
  type TripCargo,
  type TripOperationalOutcomeType,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import {
  formatArrivalButtonLabel,
  formatDepartOriginButtonLabel,
  formatDepartureButtonLabel,
  formatTripArrivalButtonLabel,
} from "../trackingActionLabels";
import {
  tripStartRouteBlockReason,
  withPatioStartEscalation,
} from "../../utils/tripStartRouteGating";
import { sinCfdiCargoBlockReason } from "../../utils/tripSinCfdiCargoGating";
import { resolveClientTrackingHubNarrative } from "../../utils/clientTrackingHub";
import { isOriginStop } from "../trackingStopEligibility";
import { StopActionInline } from "./StopActionInline";
import { canDeclareFalseTrip } from "./canDeclareFalseTrip";
import { canQuickCloseTrip } from "./canQuickCloseTrip";
import {
  buildTrackingItineraryRows,
  resolveInlineStopAction,
  type InlineStopAction,
  type TrackingItineraryRow,
} from "./trackingOperationalHelpers";
import {
  resolveTrackingPrimaryAction,
  type TrackingPrimaryActionKind,
} from "./trackingNextAction";
import { resolveDeclareFalseTripTransition } from "./transitionCopy";
import { trackingCopy } from "./trackingCopy";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";

export type TripTrackingObjectiveHubProps = {
  stops: readonly TripStop[];
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
  cargos: readonly TripCargo[];
  onStartTrip?: () => void;
  onArrive?: () => void;
  onDepart?: () => void;
  onDepartOrigin?: () => void;
  onCloseTrip?: () => void;
  onQuickCloseTrip?: () => void;
  operationalOutcome?: TripOperationalOutcomeType;
  cfdiEmissionIntent?: CfdiEmissionIntent;
  hasActiveSplit?: boolean;
  onDeclareFalseTrip?: () => void;
  /** Foco a cargas de la parada (cargo_blocked). */
  onGoToCargos?: (stopId: string) => void;
  canOperateTracking?: boolean;
  canMutateCargo?: boolean;
  isDriverPortal?: boolean;
  isClientPortal?: boolean;
  /** F5: 1 línea + CTA; demota Completar viaje / falso mid-ruta. */
  compact?: boolean;
  className?: string;
};

const OPERABLE_HUB_KINDS = new Set<TrackingPrimaryActionKind>([
  "dispatch",
  "arrive",
  "depart",
  "depart_origin",
  "close",
]);

function hubActionIcon(kind: TrackingPrimaryActionKind) {
  switch (kind) {
    case "dispatch":
      return Send;
    case "arrive":
      return MapPin;
    case "depart":
    case "depart_origin":
      return Navigation;
    case "close":
      return CheckCircle2;
    case "cargo_blocked":
      return Package;
    default:
      return MapPin;
  }
}

function formatInlineActionLabel(
  inlineAction: InlineStopAction,
  stop: TripStop,
  displayOrder: number,
): string {
  if (inlineAction.action === "arrive") {
    return formatArrivalButtonLabel(stop, displayOrder);
  }
  if (inlineAction.action === "depart") {
    return formatDepartureButtonLabel(stop, displayOrder);
  }
  if (inlineAction.action === "departOrigin") {
    return formatDepartOriginButtonLabel(stop, displayOrder);
  }
  if (inlineAction.action === "close") {
    return formatTripArrivalButtonLabel(stop, displayOrder);
  }
  return inlineAction.label;
}

function dispatchInlineStopAction(
  inlineAction: InlineStopAction,
  handlers: Pick<
    TripTrackingObjectiveHubProps,
    "onStartTrip" | "onArrive" | "onDepart" | "onDepartOrigin" | "onCloseTrip"
  >,
) {
  switch (inlineAction.action) {
    case "dispatch":
    case "start":
      handlers.onStartTrip?.();
      break;
    case "arrive":
      handlers.onArrive?.();
      break;
    case "depart":
      handlers.onDepart?.();
      break;
    case "departOrigin":
      handlers.onDepartOrigin?.();
      break;
    case "close":
      handlers.onCloseTrip?.();
      break;
    default:
      break;
  }
}

function shouldShowHubStopAction(
  tripStatus: TripStatusType,
  row: TrackingItineraryRow | null,
): boolean {
  if (row == null) return false;
  if (tripStatus === TripStatus.SCHEDULED) return isOriginStop(row.stop);
  if (tripStatus === TripStatus.IN_PROGRESS) return row.isActionTarget;
  return false;
}

/**
 * Bloque «Qué sigue» / registrar (F4): CTAs operativos del tab Seguimiento.
 */
export function TripTrackingObjectiveHub({
  stops,
  tripStatus,
  tripTimes,
  cargos,
  onStartTrip,
  onArrive,
  onDepart,
  onDepartOrigin,
  onCloseTrip,
  onQuickCloseTrip,
  operationalOutcome,
  cfdiEmissionIntent,
  hasActiveSplit = false,
  onDeclareFalseTrip,
  onGoToCargos,
  canOperateTracking = true,
  canMutateCargo: canMutateCargoProp,
  isDriverPortal = false,
  isClientPortal = false,
  compact = false,
  className,
}: TripTrackingObjectiveHubProps) {
  const declareFalseTripHintId = useId();
  const quickCloseHintId = useId();

  const rows = useMemo(
    () => buildTrackingItineraryRows(stops, tripTimes, cargos),
    [stops, tripTimes, cargos],
  );

  const primary = useMemo(
    () =>
      resolveTrackingPrimaryAction(tripStatus, stops, cargos, {
        canMutateCargo: canMutateCargoProp ?? canOperateTracking,
      }),
    [tripStatus, stops, cargos, canMutateCargoProp, canOperateTracking],
  );

  const hubTargetRow = useMemo(() => {
    if (primary.stop != null) {
      return rows.find((row) => row.stop.id === primary.stop!.id) ?? null;
    }
    if (tripStatus === TripStatus.SCHEDULED) {
      return rows.find((row) => isOriginStop(row.stop)) ?? null;
    }
    return rows.find((row) => row.isActionTarget) ?? null;
  }, [primary.stop, rows, tripStatus]);

  const clientHub = isClientPortal
    ? resolveClientTrackingHubNarrative(tripStatus)
    : null;
  const canShowStopActions =
    !isClientPortal &&
    canOperateTracking &&
    (tripStatus === TripStatus.SCHEDULED ||
      tripStatus === TripStatus.IN_PROGRESS);

  const hubInlineAction =
    canShowStopActions &&
    shouldShowHubStopAction(tripStatus, hubTargetRow) &&
    hubTargetRow != null
      ? resolveInlineStopAction(
          tripStatus,
          hubTargetRow.stop,
          hubTargetRow.nextAction,
        )
      : null;
  const hubActionLabel =
    hubInlineAction && hubTargetRow
      ? formatInlineActionLabel(
          hubInlineAction,
          hubTargetRow.stop,
          hubTargetRow.displayOrder,
        )
      : null;

  const hubIcon = hubActionIcon(primary.kind);
  const isTerminal =
    tripStatus === TripStatus.COMPLETED || tripStatus === TripStatus.CANCELLED;
  const showsDispatchCta =
    !isClientPortal &&
    canOperateTracking &&
    tripStatus === TripStatus.SCHEDULED &&
    primary.kind === "dispatch" &&
    onStartTrip != null;
  const startRouteBlockReason = showsDispatchCta
    ? withPatioStartEscalation(
        tripStartRouteBlockReason(tripStatus, stops) ??
          sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "start"),
        isDriverPortal,
        trackingCopy.hint.startBlockedEscalatePatio,
      )
    : null;
  const showsStopCta =
    hubInlineAction != null &&
    hubActionLabel != null &&
    OPERABLE_HUB_KINDS.has(primary.kind) &&
    primary.kind !== "dispatch";
  const closeCargoBlockReason =
    showsStopCta && primary.kind === "close"
      ? sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "complete")
      : null;
  const showsGoToCargosCta =
    !isClientPortal &&
    canOperateTracking &&
    primary.kind === "cargo_blocked" &&
    primary.stop != null &&
    onGoToCargos != null;
  const showsOperableCta = showsDispatchCta || showsStopCta || showsGoToCargosCta;
  const quickCloseEligible =
    !isClientPortal &&
    canOperateTracking &&
    onQuickCloseTrip != null &&
    canQuickCloseTrip(tripStatus, stops, cargos, operationalOutcome);
  const quickCloseCargoBlockReason = quickCloseEligible
    ? sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "complete")
    : null;
  /**
   * Completar viaje siempre visible cuando es elegible (atajo sin pasar
   * por todas las paradas). En Ahora (compact) se demota si no es el
   * primary; puede quedar disabled por gating de cargas, pero no se oculta.
   */
  const showsQuickCloseCta = quickCloseEligible;
  const declareFalseTripBaseEligible =
    !isClientPortal &&
    canOperateTracking &&
    onDeclareFalseTrip != null &&
    canDeclareFalseTrip(tripStatus, stops, cargos, false);
  const showsDeclareFalseTripCta =
    declareFalseTripBaseEligible && !hasActiveSplit;
  const showsDeclareFalseTripSplitBlockHint =
    declareFalseTripBaseEligible && hasActiveSplit;

  const demoteSecondaryClose = compact && primary.kind !== "close";
  const ctaSize = compact ? "default" : "lg";

  return (
    <div
      className={cn(
        "rounded-lg border",
        compact ? "space-y-2 p-2.5 sm:p-3" : "space-y-3 p-3 sm:p-4",
        isTerminal || primary.kind === "none"
          ? "border-border bg-muted/30"
          : primary.kind === "idle"
            ? "border-border bg-card"
            : "border-primary/40 bg-primary/5",
        className,
      )}
      data-tracking-section="register"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
          {isClientPortal
            ? trackingCopy.section.statusClient
            : trackingCopy.section.objective}
        </p>
        {isClientPortal || isTerminal || primary.kind === "none" ? (
          <Badge variant="outline" className="text-[10px] font-normal">
            {trackingCopy.state.readOnly}
          </Badge>
        ) : null}
      </div>

      <div
        className={cn(
          "flex gap-3",
          compact ? "flex-col sm:flex-row sm:items-center" : "flex-col sm:flex-row sm:items-start",
        )}
      >
        {!compact ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isTerminal || primary.kind === "none" || primary.kind === "idle"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/15 text-primary",
            )}
            aria-hidden
          >
            {createElement(hubIcon, { className: "h-5 w-5" })}
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div
            className={cn(
              "flex flex-col gap-2",
              compact ? "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between" : null,
            )}
          >
            <div className="min-w-0 space-y-1">
              <p
                className={cn(
                  "font-semibold",
                  compact ? "text-sm" : "text-sm",
                  isTerminal || isClientPortal ? "text-muted-foreground" : null,
                )}
              >
                {clientHub?.title ?? primary.title}
              </p>
              {clientHub ? (
                <p className="text-xs text-muted-foreground">{clientHub.body}</p>
              ) : null}
              {primary.transitionText &&
              !showsOperableCta &&
              !isClientPortal &&
              !compact ? (
                <p className="text-xs text-muted-foreground">
                  {primary.transitionText}
                </p>
              ) : null}
            </div>
            {showsDispatchCta ? (
              <StopActionInline
                label={trackingCopy.action.start}
                action="dispatch"
                variant="default"
                size={ctaSize}
                showTransition={false}
                disabled={Boolean(startRouteBlockReason)}
                disabledReason={startRouteBlockReason ?? undefined}
                onClick={() => {
                  if (startRouteBlockReason) return;
                  onStartTrip?.();
                }}
              />
            ) : showsStopCta ? (
              <StopActionInline
                label={hubActionLabel!}
                action={hubInlineAction!.action}
                variant="default"
                size={ctaSize}
                showTransition={false}
                disabled={Boolean(closeCargoBlockReason)}
                disabledReason={closeCargoBlockReason ?? undefined}
                onClick={() => {
                  if (closeCargoBlockReason) return;
                  dispatchInlineStopAction(hubInlineAction!, {
                    onStartTrip,
                    onArrive,
                    onDepart,
                    onDepartOrigin,
                    onCloseTrip,
                  });
                }}
              />
            ) : showsGoToCargosCta ? (
              <Button
                type="button"
                variant="default"
                size={ctaSize}
                className={cn(
                  compact
                    ? "h-auto min-h-9 w-full justify-start whitespace-normal py-2 text-left sm:w-auto"
                    : "h-auto min-h-10 w-full justify-start whitespace-normal py-2.5 text-left text-sm sm:w-auto",
                )}
                onClick={() => onGoToCargos?.(primary.stop!.id)}
              >
                <Package className="mr-2 h-4 w-4 shrink-0" />
                <span className="font-medium">{trackingCopy.action.goToCargos}</span>
              </Button>
            ) : null}
          </div>
          {showsQuickCloseCta ? (
            <div className="space-y-0.5">
              <Button
                type="button"
                variant={demoteSecondaryClose ? "ghost" : "outline"}
                size={demoteSecondaryClose ? "sm" : ctaSize}
                className={cn(
                  demoteSecondaryClose
                    ? "h-8 px-2 text-xs text-muted-foreground"
                    : "h-auto min-h-10 w-full justify-start whitespace-normal py-2.5 text-left text-sm sm:w-auto",
                )}
                disabled={Boolean(quickCloseCargoBlockReason)}
                title={quickCloseCargoBlockReason ?? undefined}
                aria-label={
                  quickCloseCargoBlockReason
                    ? `${trackingCopy.action.quickClose}. ${quickCloseCargoBlockReason}`
                    : undefined
                }
                onClick={() => {
                  if (quickCloseCargoBlockReason) return;
                  onQuickCloseTrip?.();
                }}
                aria-describedby={
                  !demoteSecondaryClose
                    ? quickCloseCargoBlockReason
                      ? `${quickCloseHintId}-reason`
                      : quickCloseHintId
                    : undefined
                }
              >
                <Flag
                  className={cn(
                    "shrink-0",
                    demoteSecondaryClose ? "mr-1.5 h-3.5 w-3.5" : "mr-2 h-4 w-4",
                  )}
                />
                <span className={demoteSecondaryClose ? "font-normal" : "font-medium"}>
                  {trackingCopy.action.quickClose}
                </span>
              </Button>
              {!demoteSecondaryClose ? (
                quickCloseCargoBlockReason ? (
                  <p
                    id={`${quickCloseHintId}-reason`}
                    className="text-xs text-muted-foreground"
                    role="status"
                  >
                    {quickCloseCargoBlockReason}
                  </p>
                ) : (
                  <p
                    id={quickCloseHintId}
                    className="text-xs text-muted-foreground"
                  >
                    {trackingCopy.hint.quickCloseTransition}
                  </p>
                )
              ) : null}
            </div>
          ) : null}
          {showsDeclareFalseTripCta ? (
            <div className="space-y-0.5">
              <Button
                type="button"
                variant={compact ? "link" : "outline"}
                size={compact ? "sm" : ctaSize}
                className={cn(
                  compact
                    ? "h-auto justify-start px-0 text-xs font-normal text-muted-foreground"
                    : "h-auto min-h-10 w-full justify-start whitespace-normal py-2.5 text-left text-sm sm:w-auto",
                )}
                onClick={() => onDeclareFalseTrip?.()}
                aria-describedby={compact ? undefined : declareFalseTripHintId}
              >
                <Ban
                  className={cn(
                    "shrink-0",
                    compact ? "mr-1.5 h-3.5 w-3.5" : "mr-2 h-4 w-4",
                  )}
                />
                <span className={compact ? "font-normal" : "font-medium"}>
                  {trackingCopy.action.clientCancelledCargo}
                </span>
              </Button>
              {!compact ? (
                <p
                  id={declareFalseTripHintId}
                  className="text-xs text-muted-foreground"
                >
                  {resolveDeclareFalseTripTransition(isDriverPortal)}
                </p>
              ) : null}
            </div>
          ) : showsDeclareFalseTripSplitBlockHint ? (
            <p
              id={declareFalseTripHintId}
              className="text-xs text-muted-foreground"
              role="status"
            >
              {trackingCopy.hint.declareFalseTripBlockedBySplit}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
