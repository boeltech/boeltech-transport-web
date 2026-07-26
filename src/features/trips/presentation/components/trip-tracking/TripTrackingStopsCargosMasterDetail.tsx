import { useEffect, useMemo, useState } from "react";
import { ListOrdered, Package, Truck } from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  TripStatus,
  type CargoStatusType,
  type StopStatusValue,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { cn } from "@shared/lib/utils/cn";
import { useMediaQuery } from "@shared/hooks";

import {
  formatArrivalButtonLabel,
  formatDepartOriginButtonLabel,
  formatDepartureButtonLabel,
  formatTripArrivalButtonLabel,
} from "../trackingActionLabels";
import { formatStopTimelineLabel } from "../../uiHelpers";
import { tripDetailCopy } from "../../copy";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import {
  getCargoManualActions,
  isCargoTerminal,
  type CargoManualAction,
} from "../../utils/cargoStatusActions";
import {
  getStopCargoLinks,
  isUnloadStop,
  type StopCargoLink,
} from "../../utils/stopCargoCorrelation";
import {
  canOperateCargoAtStop,
  getCargoBlockAtStop,
} from "../../utils/trackingCargoGating";
import { DetailAlertCard } from "@shared/ui/data-display";
import { CargoActionInline } from "./CargoActionInline";
import { CargoStateMachineLegend } from "./CargoStateMachineLegend";
import { StopActionInline } from "./StopActionInline";
import { StopStateMachineLegend } from "./StopStateMachineLegend";
import { TrackingEvidenceActions } from "./TrackingEvidenceActions";
import {
  buildTrackingItineraryRows,
  getTrackingStopRoleHint,
  resolveInlineStopAction,
  type InlineStopAction,
  type TrackingItineraryRow,
} from "./trackingOperationalHelpers";
import { isOriginStop } from "../trackingStopEligibility";
import { trackingCopy } from "./trackingCopy";
import type { TrackingOperationalFocusRequest } from "./trackingOperationalFocus";
import {
  TrackingStopStatusBadgeRow,
  trackingStopStatusForBadge,
} from "./trackingStopStatusBadgeConfig";

const cargoCopy = tripDetailCopy.cargo;

export type TripTrackingStopsCargosMasterDetailProps = {
  stops: readonly TripStop[];
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
  cargos: readonly TripCargo[];
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  onCargoAction: (cargoId: string, action: CargoManualAction) => void;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  onStartTrip?: () => void;
  onArrive?: () => void;
  onDepart?: () => void;
  onDepartOrigin?: () => void;
  onCloseTrip?: () => void;
  /** Evidencia contextual: el padre abre sheets con esta parada como referencia GPS. */
  onRegisterNote?: (stop: TripStop) => void;
  onRegisterIncident?: (stop: TripStop) => void;
  canRegisterEvidence?: boolean;
  /** Focus request from the guide card (cargo blocked → jump to stop). */
  focusRequest?: TrackingOperationalFocusRequest | null;
  className?: string;
};

function getCargoActionsForStopLink(
  link: StopCargoLink,
  tripInProgress: boolean,
  stopActive: boolean,
): CargoManualAction[] {
  void stopActive;
  if (!tripInProgress) return [];

  const allActions = getCargoManualActions(link.cargo.status, tripInProgress);
  const actions: CargoManualAction[] = [];

  if (link.movementType === "pickup" && allActions.includes("pickup")) {
    actions.push("pickup");
  }
  if (link.movementType === "delivery" && allActions.includes("deliver")) {
    actions.push("deliver");
  }
  if (allActions.includes("return")) actions.push("return");
  if (allActions.includes("cancel")) actions.push("cancel");

  return actions;
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
    TripTrackingStopsCargosMasterDetailProps,
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

function shouldShowStopAction(
  tripStatus: TripStatusType,
  row: TrackingItineraryRow,
  selectedStopId: string,
): boolean {
  if (row.stop.id !== selectedStopId) return false;
  if (tripStatus === TripStatus.SCHEDULED) return true;
  if (tripStatus === TripStatus.IN_PROGRESS) return row.isActionTarget;
  return false;
}

type TripTrackingStopMasterRowProps = {
  row: TrackingItineraryRow;
  cargoCount: number;
  selected: boolean;
  showHints: boolean;
  onClick: () => void;
};

function TripTrackingStopMasterRow({
  row,
  cargoCount,
  selected,
  showHints,
  onClick,
}: TripTrackingStopMasterRowProps) {
  const { primary, secondary } = formatStopTimelineLabel(
    row.stop,
    row.displayOrder,
  );
  const stopStatus = trackingStopStatusForBadge(
    row.stop.status as StopStatusValue | undefined,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-background shadow-sm"
          : "border-transparent bg-card hover:border-border",
        row.isActionTarget && showHints && !selected
          ? "border-primary/30 bg-primary/5"
          : null,
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{primary}</span>
          <TrackingStopStatusBadgeRow
            status={stopStatus}
            isActive={row.isActionTarget && showHints}
          />
        </div>
        {secondary ? (
          <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {cargoCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              {trackingCopy.label.cargoCount(cargoCount)}
            </span>
          ) : null}
          {row.isActionTarget && showHints ? (
            <Badge variant="outline" className="text-[10px] border-primary/50">
              {trackingCopy.label.currentTarget}
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}

type TripTrackingStopOperationDetailProps = {
  row: TrackingItineraryRow;
  tripStatus: TripStatusType;
  orderedStops: readonly TripStop[];
  cargos: readonly TripCargo[];
  showHints: boolean;
  showStopAction: boolean;
  tripInProgress: boolean;
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  onCargoAction: (cargoId: string, action: CargoManualAction) => void;
  onStartTrip?: () => void;
  onArrive?: () => void;
  onDepart?: () => void;
  onDepartOrigin?: () => void;
  onCloseTrip?: () => void;
  onRegisterNote?: (stop: TripStop) => void;
  onRegisterIncident?: (stop: TripStop) => void;
  canRegisterEvidence?: boolean;
};

function TripTrackingStopOperationDetail({
  row,
  tripStatus,
  orderedStops,
  cargos,
  showHints,
  showStopAction,
  tripInProgress,
  pendingCargoAction,
  getCargoStatusVariant,
  onCargoAction,
  onStartTrip,
  onArrive,
  onDepart,
  onDepartOrigin,
  onCloseTrip,
  onRegisterNote,
  onRegisterIncident,
  canRegisterEvidence = false,
}: TripTrackingStopOperationDetailProps) {
  const { primary, secondary } = formatStopTimelineLabel(
    row.stop,
    row.displayOrder,
  );
  const stopStatus = trackingStopStatusForBadge(
    row.stop.status as StopStatusValue | undefined,
  );
  const roleHint = showHints ? getTrackingStopRoleHint(row.stop) : null;
  const inlineAction = showStopAction
    ? resolveInlineStopAction(tripStatus, row.stop, row.nextAction)
    : null;
  const actionLabel = inlineAction
    ? formatInlineActionLabel(inlineAction, row.stop, row.displayOrder)
    : null;
  const links = getStopCargoLinks(row.stop, cargos, orderedStops);
  const stopActive = canOperateCargoAtStop(row.stop, tripStatus);
  const cargoBlock = getCargoBlockAtStop(row.stop, cargos, orderedStops);
  const cargoActionsEnabled = tripInProgress && stopActive;
  const showEvidenceToolbar =
    canRegisterEvidence &&
    onRegisterNote != null &&
    onRegisterIncident != null;

  return (
    <div className="space-y-4">
      <header className="space-y-2 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{primary}</h3>
          <TrackingStopStatusBadgeRow
            status={stopStatus}
            isActive={row.isActionTarget && showHints}
          />
          {row.isActionTarget && showHints ? (
            <Badge variant="outline" className="text-xs border-primary/50">
              {trackingCopy.label.currentTarget}
            </Badge>
          ) : null}
        </div>
        {secondary ? (
          <p className="text-sm text-muted-foreground">{secondary}</p>
        ) : null}
        {roleHint ? (
          <p className="text-xs text-muted-foreground">{roleHint}</p>
        ) : null}
      </header>

      {row.nextAction === "resolve_cargo_at_stop" && cargoBlock.blocked ? (
        <DetailAlertCard
          severity="warning"
          icon={<Package className="h-4 w-4" />}
          title={trackingCopy.hint.cargoBlockedBeforeDeparture}
          items={cargoBlock.descriptions.map((text) => ({ text }))}
        />
      ) : null}

      {inlineAction && actionLabel ? (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Acciones de parada
          </p>
          <StopActionInline
            label={actionLabel}
            action={inlineAction.action}
            variant="default"
            size="lg"
            onClick={() =>
              dispatchInlineStopAction(inlineAction, {
                onStartTrip,
                onArrive,
                onDepart,
                onDepartOrigin,
                onCloseTrip,
              })
            }
          />
        </section>
      ) : null}

      {showEvidenceToolbar ? (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {trackingCopy.label.evidenceAtStop}
          </p>
          <p className="text-xs text-muted-foreground">
            {trackingCopy.hint.evidenceAtStop}
          </p>
          <TrackingEvidenceActions
            onRegisterNote={() => onRegisterNote(row.stop)}
            onRegisterIncident={() => onRegisterIncident(row.stop)}
            canRegisterNote={canRegisterEvidence}
            canRegisterIncident={canRegisterEvidence}
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Package className="h-3.5 w-3.5 shrink-0" />
          {cargoCopy.section.atStop}
        </p>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isUnloadStop(row.stop)
              ? cargoCopy.state.emptyDeliveryAtStopTitle
              : cargoCopy.state.emptyAtStopTitle}
          </p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => {
              const actions = getCargoActionsForStopLink(
                link,
                tripInProgress,
                stopActive,
              );
              const terminal = isCargoTerminal(link.cargo.status);

              return (
                <li
                  key={`${link.cargo.id}-${link.movement.id ?? link.movementType}`}
                  className="flex flex-col gap-2 rounded-md border bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {link.movementType === "pickup" ? (
                        <Package
                          className="h-3.5 w-3.5 shrink-0 text-info"
                          aria-hidden
                        />
                      ) : (
                        <Truck
                          className="h-3.5 w-3.5 shrink-0 text-warning"
                          aria-hidden
                        />
                      )}
                      <span className="truncate text-sm font-medium">
                        {link.cargo.description}
                      </span>
                      <Badge
                        variant={getCargoStatusVariant(link.cargo.status)}
                        className="text-xs font-normal"
                      >
                        {CARGO_STATUS_LABELS[link.cargo.status] ??
                          link.cargo.status}
                      </Badge>
                      {link.movement.completedAt != null ? (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {cargoCopy.label.movementDone}
                        </Badge>
                      ) : null}
                    </div>
                    {link.cargo.weight != null ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.cargo.weight.toLocaleString("es-MX")} kg
                      </p>
                    ) : null}
                  </div>
                  {!terminal && actions.length > 0 ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {actions.map((action) => {
                        const isPending =
                          pendingCargoAction?.cargoId === link.cargo.id &&
                          pendingCargoAction.action === action;
                        const disabled = !cargoActionsEnabled;
                        return (
                          <CargoActionInline
                            key={action}
                            action={action}
                            pending={isPending}
                            disabled={disabled}
                            title={
                              disabled
                                ? stopActive
                                  ? undefined
                                  : trackingCopy.hint.cargoActionRequiresArrival
                                : undefined
                            }
                            onClick={() => onCargoAction(link.cargo.id, action)}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function TripTrackingStopsCargosMasterDetail({
  stops,
  tripStatus,
  tripTimes,
  cargos,
  pendingCargoAction,
  onCargoAction,
  getCargoStatusVariant,
  onStartTrip,
  onArrive,
  onDepart,
  onDepartOrigin,
  onCloseTrip,
  onRegisterNote,
  onRegisterIncident,
  canRegisterEvidence = tripStatus === TripStatus.IN_PROGRESS,
  focusRequest = null,
  className,
}: TripTrackingStopsCargosMasterDetailProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  /**
   * Selección explícita del operador. Caduca cuando avanza el objetivo
   * operativo (`actionTargetId`) o llega un `focusRequest` nuevo.
   */
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [selectionEpochTargetId, setSelectionEpochTargetId] = useState<
    string | null
  >(null);
  const [appliedFocusNonce, setAppliedFocusNonce] = useState<number | null>(
    null,
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const rows = useMemo(
    () => buildTrackingItineraryRows(stops, tripTimes, cargos),
    [stops, tripTimes, cargos],
  );

  const actionTargetId = useMemo(
    () => rows.find((row) => row.isActionTarget)?.stop.id ?? null,
    [rows],
  );

  // Ajuste de estado durante render (patrón React vs useEffect+setState en cascada).
  if (
    focusRequest != null &&
    focusRequest.nonce !== appliedFocusNonce &&
    rows.some((row) => row.stop.id === focusRequest.stopId)
  ) {
    setAppliedFocusNonce(focusRequest.nonce);
    setUserSelectedId(focusRequest.stopId);
    setSelectionEpochTargetId(actionTargetId);
  }

  useEffect(() => {
    if (focusRequest == null || !isMobile) return;
    if (!rows.some((row) => row.stop.id === focusRequest.stopId)) return;
    setMobileSheetOpen(true);
  }, [focusRequest, isMobile, rows]);

  const resolvedViewId = useMemo(() => {
    if (rows.length === 0) return null;

    const userSelectionValid =
      userSelectedId != null &&
      rows.some((row) => row.stop.id === userSelectedId) &&
      selectionEpochTargetId === actionTargetId;

    if (userSelectionValid) {
      return userSelectedId;
    }

    if (actionTargetId != null) {
      return actionTargetId;
    }

    if (tripStatus === TripStatus.SCHEDULED) {
      return (
        rows.find((row) => isOriginStop(row.stop))?.stop.id ??
        rows[0]?.stop.id ??
        null
      );
    }

    return rows[0]?.stop.id ?? null;
  }, [
    rows,
    userSelectedId,
    selectionEpochTargetId,
    actionTargetId,
    tripStatus,
  ]);

  const listHighlightId = resolvedViewId;
  const selectedRow = useMemo(
    () => rows.find((row) => row.stop.id === resolvedViewId) ?? null,
    [rows, resolvedViewId],
  );

  const showHints = tripStatus === TripStatus.IN_PROGRESS;
  const tripInProgress = tripStatus === TripStatus.IN_PROGRESS;
  const canShowStopActions =
    tripStatus === TripStatus.SCHEDULED || tripStatus === TripStatus.IN_PROGRESS;

  const handleSelect = (stopId: string) => {
    setUserSelectedId(stopId);
    setSelectionEpochTargetId(actionTargetId);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  };

  const detailProps = selectedRow
    ? {
        row: selectedRow,
        tripStatus,
        orderedStops: stops,
        cargos,
        showHints,
        showStopAction:
          canShowStopActions &&
          shouldShowStopAction(tripStatus, selectedRow, selectedRow.stop.id),
        tripInProgress,
        pendingCargoAction,
        getCargoStatusVariant,
        onCargoAction,
        onStartTrip,
        onArrive,
        onDepart,
        onDepartOrigin,
        onCloseTrip,
        onRegisterNote,
        onRegisterIncident,
        canRegisterEvidence,
      }
    : null;

  return (
    <Card id="tracking-stops-cargos" className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          {trackingCopy.section.stopsAndCargos}
        </CardTitle>
        <CardDescription>{trackingCopy.hint.stopsAndCargos}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <StopStateMachineLegend />
          {cargos.length > 0 ? <CargoStateMachineLegend /> : null}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {trackingCopy.state.noStops}.
          </p>
        ) : (
          <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:gap-0">
            <div className="flex flex-col gap-1.5 md:max-h-[min(28rem,65vh)] md:overflow-y-auto md:border-r md:p-2">
              {rows.map((row) => (
                <TripTrackingStopMasterRow
                  key={row.stop.id}
                  row={row}
                  cargoCount={getStopCargoLinks(row.stop, cargos, stops).length}
                  selected={listHighlightId === row.stop.id}
                  showHints={showHints}
                  onClick={() => handleSelect(row.stop.id)}
                />
              ))}
            </div>

            {!isMobile ? (
              <div className="bg-background md:rounded-r-md md:p-5">
                {detailProps ? (
                  <TripTrackingStopOperationDetail {...detailProps} />
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    {trackingCopy.hint.selectStop}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-dashed py-8 text-sm text-muted-foreground md:hidden">
                {trackingCopy.hint.selectStop}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Sheet
        open={isMobile && mobileSheetOpen && selectedRow != null}
        onOpenChange={setMobileSheetOpen}
      >
        <SheetContent side="bottom" className="h-[85vh] overflow-hidden p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{trackingCopy.hint.mobileDetailSheet}</SheetTitle>
            <SheetDescription>
              {trackingCopy.hint.stopsAndCargos}
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(85vh-88px)] overflow-y-auto px-5 py-4">
            {detailProps ? (
              <TripTrackingStopOperationDetail {...detailProps} />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
