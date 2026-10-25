import { createElement, useId, useMemo } from "react";
import {
  Ban,
  CheckCircle2,
  Flag,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  Phone,
  Send,
  AlertTriangle,
  StickyNote,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
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
import { CargoActionInline } from "./CargoActionInline";
import { canDeclareFalseTrip } from "./canDeclareFalseTrip";
import { canQuickCloseTrip } from "./canQuickCloseTrip";
import {
  listOperatePendingCargoActions,
  resolveOperateCargoCtaLabel,
} from "./operateCargoActions";
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
import type { CargoManualAction } from "../../utils/cargoStatusActions";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";

/** Contacto flota en overflow Operate (PD5). */
export type TrackingContactInfo = {
  driverName?: string | null;
  vehicleLabel?: string | null;
  /** Teléfono operativo del conductor; si falta, fila «No capturado» y sin «Llamar». */
  driverPhone?: string | null;
};

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
  /**
   * Legacy / workbench: abrir cargas de la parada (N cargas o sin onCargoAction).
   * F3: no debe ser el único camino cuando hay mutación directa.
   */
  onGoToCargos?: (stopId: string) => void;
  /** F3 / D6: mutar carga desde Operate (≤2 clics). */
  onCargoAction?: (cargoId: string, action: CargoManualAction) => void;
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  /** Evidencia — overflow Operate (PD5). */
  onRegisterNote?: () => void;
  onRegisterIncident?: () => void;
  canRegisterNote?: boolean;
  canRegisterIncident?: boolean;
  /** Contacto flota — overflow Operate (PD5). */
  contact?: TrackingContactInfo | null;
  /** PD12: línea mid-trip → tab Ruta. */
  onGoToRouteTab?: () => void;
  showMidTripRouteHint?: boolean;
  canOperateTracking?: boolean;
  canMutateCargo?: boolean;
  isDriverPortal?: boolean;
  isClientPortal?: boolean;
  /**
   * Layout A Operate: 1 CTA `default` + ⋯ (PD5 / D5).
   * Sin compact: hub legado (master-detail) conserva secundarias visibles.
   */
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
 * Bloque «Qué sigue» / registrar: CTAs operativos del tab Seguimiento.
 * Layout A (compact): un `default` de mutación + overflow ⋯ (PD5 / D5).
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
  onCargoAction,
  pendingCargoAction = null,
  onRegisterNote,
  onRegisterIncident,
  canRegisterNote = false,
  canRegisterIncident = false,
  contact = null,
  onGoToRouteTab,
  showMidTripRouteHint = false,
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
  const canMutateCargo = canMutateCargoProp ?? canOperateTracking;
  const operateCargoItems =
    !isClientPortal &&
    canOperateTracking &&
    canMutateCargo &&
    primary.kind === "cargo_blocked" &&
    primary.stop != null
      ? listOperatePendingCargoActions(
          primary.stop,
          cargos,
          stops,
          tripStatus,
        )
      : [];
  const operateCargoStopLabel =
    primary.stop?.locationName?.trim() ||
    (primary.displayOrder != null
      ? `parada #${primary.displayOrder}`
      : "esta parada");
  /** 1 carga + onCargoAction → mutación directa (1 clic). */
  const showsDirectCargoCta =
    operateCargoItems.length === 1 && onCargoAction != null;
  /**
   * N cargas: lista inline con mutación (1 clic) cuando hay onCargoAction;
   * si no, CTA que abre workbench (≤2 clics con acción visible).
   */
  const showsInlineCargoList =
    operateCargoItems.length > 1 && onCargoAction != null;
  const showsGoToCargosCta =
    !isClientPortal &&
    canOperateTracking &&
    primary.kind === "cargo_blocked" &&
    primary.stop != null &&
    !showsDirectCargoCta &&
    !showsInlineCargoList &&
    onGoToCargos != null;
  const showsOperableCta =
    showsDispatchCta ||
    showsStopCta ||
    showsDirectCargoCta ||
    showsInlineCargoList ||
    showsGoToCargosCta;
  const quickCloseEligible =
    !isClientPortal &&
    canOperateTracking &&
    onQuickCloseTrip != null &&
    canQuickCloseTrip(tripStatus, stops, cargos, operationalOutcome);
  const quickCloseCargoBlockReason = quickCloseEligible
    ? sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "complete")
    : null;
  const showsQuickCloseCta = quickCloseEligible;
  const declareFalseTripDomainEligible = canDeclareFalseTrip({
    tripStatus,
    stops,
    cargos,
    hasActiveRevenueSplit: false,
    cfdiEmissionIntent,
    operationalOutcome,
  });
  const declareFalseTripBaseEligible =
    !isClientPortal &&
    canOperateTracking &&
    onDeclareFalseTrip != null &&
    declareFalseTripDomainEligible;
  const showsDeclareFalseTripCta =
    declareFalseTripBaseEligible && !hasActiveSplit;
  const showsDeclareFalseTripSplitBlockHint =
    declareFalseTripBaseEligible && hasActiveSplit;

  const demoteSecondaryClose = compact && primary.kind !== "close";
  const ctaSize = compact ? "default" : "lg";
  /** Operate (compact): secundarias en ⋯ — un solo `default` ATF (D5 / PD5). */
  const useOverflowMenu = compact && !isClientPortal;

  const driverName = contact?.driverName?.trim() || null;
  const vehicleLabel = contact?.vehicleLabel?.trim() || null;
  const driverPhone = contact?.driverPhone?.trim() || null;
  const hasContact = Boolean(driverName || vehicleLabel);
  const showEvidenceInOverflow =
    useOverflowMenu &&
    onRegisterNote != null &&
    onRegisterIncident != null;
  const showOverflowMenu =
    useOverflowMenu &&
    (showsQuickCloseCta ||
      showsDeclareFalseTripCta ||
      showsDeclareFalseTripSplitBlockHint ||
      showEvidenceInOverflow ||
      hasContact);

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
          compact
            ? "flex-col sm:flex-row sm:items-center"
            : "flex-col sm:flex-row sm:items-start",
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
              compact
                ? "sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                : null,
            )}
          >
            <div className="min-w-0 space-y-1">
              <p
                className={cn(
                  "font-semibold text-sm",
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
            <div
              className={cn(
                "flex flex-wrap items-start gap-2",
                compact ? "w-full sm:w-auto" : null,
              )}
            >
              {showsDispatchCta ? (
                <StopActionInline
                  label={trackingCopy.action.start}
                  action="dispatch"
                  variant="default"
                  size={ctaSize}
                  showTransition={compact}
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
                  showTransition={compact}
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
              ) : showsDirectCargoCta ? (
                <CargoActionInline
                  action={operateCargoItems[0]!.action}
                  label={resolveOperateCargoCtaLabel(
                    operateCargoItems,
                    operateCargoStopLabel,
                  )}
                  variant="default"
                  size={ctaSize}
                  showTransition={compact}
                  pending={
                    pendingCargoAction?.cargoId ===
                      operateCargoItems[0]!.cargoId &&
                    pendingCargoAction.action === operateCargoItems[0]!.action
                  }
                  onClick={() =>
                    onCargoAction?.(
                      operateCargoItems[0]!.cargoId,
                      operateCargoItems[0]!.action,
                    )
                  }
                />
              ) : showsInlineCargoList ? (
                <ul
                  className="flex w-full flex-col gap-2 sm:max-w-md"
                  data-tracking-section="operate-cargos"
                >
                  {operateCargoItems.map((item, index) => (
                    <li
                      key={`${item.cargoId}-${item.action}`}
                      className="flex flex-col gap-1 rounded-md border bg-card/60 px-2.5 py-2"
                    >
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.description}
                      </p>
                      <CargoActionInline
                        action={item.action}
                        label={
                          item.action === "pickup"
                            ? trackingCopy.action.markPickup
                            : trackingCopy.action.markDeliver
                        }
                        variant={index === 0 ? "default" : "outline"}
                        size={index === 0 ? ctaSize : "sm"}
                        showTransition={compact && index === 0}
                        pending={
                          pendingCargoAction?.cargoId === item.cargoId &&
                          pendingCargoAction.action === item.action
                        }
                        onClick={() =>
                          onCargoAction?.(item.cargoId, item.action)
                        }
                      />
                    </li>
                  ))}
                </ul>
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
                  <span className="font-medium">
                    {resolveOperateCargoCtaLabel(
                      operateCargoItems,
                      operateCargoStopLabel,
                    )}
                  </span>
                </Button>
              ) : null}
              {showOverflowMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      aria-label={trackingCopy.action.moreActions}
                      data-tracking-section="operate-overflow"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {showsQuickCloseCta ? (
                      <DropdownMenuItem
                        disabled={Boolean(quickCloseCargoBlockReason)}
                        title={quickCloseCargoBlockReason ?? undefined}
                        onSelect={() => {
                          if (quickCloseCargoBlockReason) return;
                          onQuickCloseTrip?.();
                        }}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        {trackingCopy.action.quickClose}
                      </DropdownMenuItem>
                    ) : null}
                    {showsDeclareFalseTripCta ? (
                      <DropdownMenuItem
                        onSelect={() => onDeclareFalseTrip?.()}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        {trackingCopy.action.declareFalseTrip}
                      </DropdownMenuItem>
                    ) : null}
                    {showsDeclareFalseTripSplitBlockHint ? (
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground whitespace-normal">
                        {trackingCopy.hint.declareFalseTripBlockedBySplit}
                      </DropdownMenuLabel>
                    ) : null}
                    {showEvidenceInOverflow ? (
                      <>
                        {showsQuickCloseCta ||
                        showsDeclareFalseTripCta ||
                        showsDeclareFalseTripSplitBlockHint ? (
                          <DropdownMenuSeparator />
                        ) : null}
                        <DropdownMenuItem
                          disabled={!canRegisterNote}
                          title={
                            canRegisterNote
                              ? undefined
                              : trackingCopy.error.registerRequiresInProgress
                          }
                          onSelect={() => onRegisterNote?.()}
                        >
                          <StickyNote className="mr-2 h-4 w-4" />
                          {trackingCopy.action.note}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canRegisterIncident}
                          title={
                            canRegisterIncident
                              ? undefined
                              : trackingCopy.error.registerRequiresInProgress
                          }
                          onSelect={() => onRegisterIncident?.()}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          {trackingCopy.action.incident}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {hasContact ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          {trackingCopy.section.contact}
                        </DropdownMenuLabel>
                        {driverName ? (
                          <DropdownMenuLabel className="font-normal">
                            {trackingCopy.label.operator}: {driverName}
                          </DropdownMenuLabel>
                        ) : null}
                        {vehicleLabel ? (
                          <DropdownMenuLabel className="font-normal">
                            {trackingCopy.label.unit}: {vehicleLabel}
                          </DropdownMenuLabel>
                        ) : null}
                        {driverPhone ? (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${driverPhone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              {trackingCopy.action.call}
                            </a>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            {trackingCopy.label.mobile}:{" "}
                            {trackingCopy.label.mobileNotCaptured}
                          </DropdownMenuLabel>
                        )}
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          {showMidTripRouteHint && onGoToRouteTab && !isClientPortal ? (
            <p className="text-xs text-muted-foreground">
              <button
                type="button"
                className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                onClick={onGoToRouteTab}
                data-tracking-section="mid-trip-route-hint"
              >
                {trackingCopy.hint.midTripRouteChanges}
              </button>
            </p>
          ) : null}

          {!useOverflowMenu && showsQuickCloseCta ? (
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
                  quickCloseCargoBlockReason
                    ? `${quickCloseHintId}-reason`
                    : !demoteSecondaryClose
                      ? quickCloseHintId
                      : undefined
                }
              >
                <Flag
                  className={cn(
                    "shrink-0",
                    demoteSecondaryClose
                      ? "mr-1.5 h-3.5 w-3.5"
                      : "mr-2 h-4 w-4",
                  )}
                />
                <span
                  className={demoteSecondaryClose ? "font-normal" : "font-medium"}
                >
                  {trackingCopy.action.quickClose}
                </span>
              </Button>
              {quickCloseCargoBlockReason ? (
                <p
                  id={`${quickCloseHintId}-reason`}
                  className="text-xs text-muted-foreground"
                  role="status"
                >
                  {quickCloseCargoBlockReason}
                </p>
              ) : !demoteSecondaryClose ? (
                <p
                  id={quickCloseHintId}
                  className="text-xs text-muted-foreground"
                >
                  {trackingCopy.hint.quickCloseTransition}
                </p>
              ) : null}
            </div>
          ) : null}
          {!useOverflowMenu && showsDeclareFalseTripCta ? (
            <div className="space-y-0.5">
              <Button
                type="button"
                variant="outline"
                size={ctaSize}
                className="h-auto min-h-10 w-full justify-start whitespace-normal py-2.5 text-left text-sm sm:w-auto"
                onClick={() => onDeclareFalseTrip?.()}
                aria-describedby={declareFalseTripHintId}
              >
                <Ban className="mr-2 h-4 w-4 shrink-0" />
                <span className="font-medium">
                  {trackingCopy.action.declareFalseTrip}
                </span>
              </Button>
              <p
                id={declareFalseTripHintId}
                className="text-xs text-muted-foreground"
              >
                {resolveDeclareFalseTripTransition(isDriverPortal)}
              </p>
            </div>
          ) : !useOverflowMenu && showsDeclareFalseTripSplitBlockHint ? (
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
