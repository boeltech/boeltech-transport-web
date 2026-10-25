import { useEffect, useMemo, useState } from "react";
import type { TrackingTrafficLight } from "@boeltech/cfdi-domain";
import {
  ListOrdered,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";

import {
  TripStatus,
  type CargoStatusType,
  type CfdiEmissionIntent,
  type StopStatusValue,
  type TrackingTimelineProgress,
  type TripCargo,
  type TripOperationalOutcomeType,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { cn } from "@shared/lib/utils/cn";
import { useMediaQuery } from "@shared/hooks";

import { formatStopTimelineLabel } from "../../uiHelpers";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import type { CargoManualAction } from "../../utils/cargoStatusActions";
import { getStopCargoLinks } from "../../utils/stopCargoCorrelation";
import { Button } from "@shared/ui/button";
import { CargoStateMachineLegend } from "./CargoStateMachineLegend";
import { StopStateMachineLegend } from "./StopStateMachineLegend";
import { TripTrackingObjectiveHub } from "./TripTrackingObjectiveHub";
import { TripTrackingProgressStrip } from "./TripTrackingProgressStrip";
import { TripTrackingStopOperationDetail } from "./TripTrackingStopOperationDetail";
import {
  buildTrackingItineraryRows,
  type TrackingItineraryRow,
} from "./trackingOperationalHelpers";
import { isOriginStop } from "../trackingStopEligibility";
import { trackingCopy } from "./trackingCopy";
import type { TrackingOperationalFocusRequest } from "./trackingOperationalFocus";
import {
  TrackingStopStatusBadgeRow,
  trackingStopStatusForBadge,
} from "./trackingStopStatusBadgeConfig";

export type TripTrackingStopsCargosMasterDetailProps = {
  stops: readonly TripStop[];
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
  cargos: readonly TripCargo[];
  /** Progreso del timeline para la línea de contexto del hub (D4). */
  progress?: TrackingTimelineProgress | null;
  actualDeparture?: Date | null;
  /** Semáforo operativo derivado (F1-B). */
  trafficLight?: TrackingTrafficLight;
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
  /** ADR-0088: atajo «Completar viaje» → QuickCloseTripSheet. */
  onQuickCloseTrip?: () => void;
  /** ADR-0079 / ADR-0088: oculta atajo si el viaje es en falso. */
  operationalOutcome?: TripOperationalOutcomeType;
  /**
   * ADR-0096: gate de carga en Iniciar / Completar / QuickClose cuando
   * `sin_cfdi_efectivo` y no hay cargas activas.
   */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  /**
   * T4-043 / ADR-0081: prorrateo activo (`invoicing.hasActiveSplit`).
   * Si true, no se muestra el CTA de viaje en falso (mutex API).
   */
  hasActiveSplit?: boolean;
  /** PD1: CTA secundario «El cliente canceló la carga» → sheet de declaración. */
  onDeclareFalseTrip?: () => void;
  /** Evidencia contextual: el padre abre sheets con esta parada como referencia GPS. */
  onRegisterNote?: (stop: TripStop) => void;
  onRegisterIncident?: (stop: TripStop) => void;
  canRegisterEvidence?: boolean;
  /**
   * RBAC: `trips.update` | `trips.updateStatus` | `trips.execute`.
   * Sin permiso no se muestran CTAs de parada ni evidencia.
   */
  canOperateTracking?: boolean;
  /**
   * RBAC: `trips.update` para mutaciones de carga (API).
   * Si se omite, hereda `canOperateTracking` (compat staff).
   */
  canMutateCargo?: boolean;
  /** Conductor: cargo_blocked, falso e Iniciar bloqueado (D10–D12). */
  isDriverPortal?: boolean;
  /** Cliente: hub = narrativa de estado; sin Iniciar/Registrar/Completar/falso (D11). */
  isClientPortal?: boolean;
  /** Focus request (p. ej. desde deep-link); selecciona parada en el hub. */
  focusRequest?: TrackingOperationalFocusRequest | null;
  /**
   * Meta de frescura del timeline en el CardHeader del hub (badge «En vivo» /
   * «Actualizado hace…»). Evita una toolbar suelta bajo los tabs del detalle.
   */
  showLiveBadge?: boolean;
  updatedAgoLabel?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /**
   * F4: ocultar ProgressStrip cuando el tab lo eleva a cabecera.
   * @default true
   */
  showProgressStrip?: boolean;
  /**
   * F4: ocultar «Qué sigue» cuando el tab lo coloca junto a alertas/feed.
   * @default true
   */
  showObjectiveHub?: boolean;
  /**
   * F5: detail sin reimprimir badges/plan-real del riel (cabecera canónica = riel).
   * @default false
   */
  compactDetailHeader?: boolean;
  className?: string;
};

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
        {secondary ? (
          <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        ) : null}
        {row.planRealLines.length > 0 ? (
          <ul className="space-y-0.5 text-xs tabular-nums text-muted-foreground">
            {row.planRealLines.map((line) => (
              <li key={line.kind}>{line.summary}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {cargoCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              {trackingCopy.label.cargoCount(cargoCount)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function TripTrackingStopsCargosMasterDetail({
  stops,
  tripStatus,
  tripTimes,
  cargos,
  progress = null,
  trafficLight = "n/a",
  pendingCargoAction,
  onCargoAction,
  getCargoStatusVariant,
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
  onRegisterNote,
  onRegisterIncident,
  canRegisterEvidence = tripStatus === TripStatus.IN_PROGRESS,
  canOperateTracking = true,
  canMutateCargo: canMutateCargoProp,
  isDriverPortal = false,
  isClientPortal = false,
  focusRequest = null,
  showLiveBadge = false,
  updatedAgoLabel = null,
  onRefresh,
  isRefreshing = false,
  showProgressStrip = true,
  showObjectiveHub = true,
  compactDetailHeader = false,
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
  const canMutateCargo =
    (canMutateCargoProp ?? canOperateTracking) && tripInProgress;

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
        tripInProgress: canMutateCargo,
        pendingCargoAction,
        getCargoStatusVariant,
        onCargoAction,
        onRegisterNote,
        onRegisterIncident,
        canRegisterEvidence: canOperateTracking && canRegisterEvidence,
        canMutateCargo,
        compactDetailHeader,
      }
    : null;

  return (
    <Card id="tracking-stops-cargos" className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-4 w-4 shrink-0 text-primary" />
            {trackingCopy.section.stopsAndCargos}
          </CardTitle>
          {showLiveBadge ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {trackingCopy.state.live}
            </Badge>
          ) : null}
          {updatedAgoLabel ? (
            <span className="text-sm text-muted-foreground">
              {trackingCopy.hint.updatedAgo(updatedAgoLabel)}
            </span>
          ) : null}
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="shrink-0 gap-1.5"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {trackingCopy.action.refresh}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {showObjectiveHub ? (
          <div className="space-y-3">
            <TripTrackingObjectiveHub
              stops={stops}
              tripStatus={tripStatus}
              tripTimes={tripTimes}
              cargos={cargos}
              onStartTrip={onStartTrip}
              onArrive={onArrive}
              onDepart={onDepart}
              onDepartOrigin={onDepartOrigin}
              onCloseTrip={onCloseTrip}
              onQuickCloseTrip={onQuickCloseTrip}
              operationalOutcome={operationalOutcome}
              cfdiEmissionIntent={cfdiEmissionIntent}
              hasActiveSplit={hasActiveSplit}
              onDeclareFalseTrip={onDeclareFalseTrip}
              onGoToCargos={handleSelect}
              onCargoAction={canMutateCargo ? onCargoAction : undefined}
              pendingCargoAction={pendingCargoAction}
              canOperateTracking={canOperateTracking}
              canMutateCargo={canMutateCargoProp}
              isDriverPortal={isDriverPortal}
              isClientPortal={isClientPortal}
            />
            {showProgressStrip && progress != null ? (
              <TripTrackingProgressStrip
                progress={progress}
                tripStatus={tripStatus}
                trafficLight={trafficLight}
                readOnly={
                  !canOperateTracking ||
                  (tripStatus !== TripStatus.SCHEDULED &&
                    tripStatus !== TripStatus.IN_PROGRESS)
                }
              />
            ) : null}
          </div>
        ) : showProgressStrip && progress != null ? (
          <TripTrackingProgressStrip
            progress={progress}
            tripStatus={tripStatus}
            trafficLight={trafficLight}
            readOnly={
              !canOperateTracking ||
              (tripStatus !== TripStatus.SCHEDULED &&
                tripStatus !== TripStatus.IN_PROGRESS)
            }
          />
        ) : null}

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {trackingCopy.state.noStops}
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

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <StopStateMachineLegend />
          {cargos.length > 0 ? <CargoStateMachineLegend /> : null}
        </div>
      </CardContent>

      <Sheet
        open={isMobile && mobileSheetOpen && selectedRow != null}
        onOpenChange={setMobileSheetOpen}
      >
        <SheetContent side="bottom" className="h-[85vh] overflow-hidden p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{trackingCopy.hint.mobileDetailSheet}</SheetTitle>
            <SheetDescription>
              {trackingCopy.section.cargosAtStop}
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
