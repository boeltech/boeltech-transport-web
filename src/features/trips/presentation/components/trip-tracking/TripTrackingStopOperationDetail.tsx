import {
  Package,
  Truck,
} from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  type CargoStatusType,
  type StopStatusValue,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { DetailAlertCard } from "@shared/ui/data-display";

import { formatStopTimelineLabel } from "../../uiHelpers";
import { tripDetailCopy } from "../../copy";
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
import { isCargoHazmat } from "../trip-cargos/tripCargoDetailHelpers";
import { CargoActionInline } from "./CargoActionInline";
import { TrackingEvidenceActions } from "./TrackingEvidenceActions";
import type { TrackingItineraryRow } from "./trackingOperationalHelpers";
import {
  TrackingStopStatusBadgeRow,
  trackingStopStatusForBadge,
} from "./trackingStopStatusBadgeConfig";
import { trackingCopy } from "./trackingCopy";

const cargoCopy = tripDetailCopy.cargo;

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

export type TripTrackingStopOperationDetailProps = {
  row: TrackingItineraryRow;
  tripStatus: TripStatusType;
  orderedStops: readonly TripStop[];
  cargos: readonly TripCargo[];
  showHints: boolean;
  tripInProgress: boolean;
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  onCargoAction: (cargoId: string, action: CargoManualAction) => void;
  onRegisterNote?: (stop: TripStop) => void;
  onRegisterIncident?: (stop: TripStop) => void;
  canRegisterEvidence?: boolean;
  canMutateCargo?: boolean;
  compactDetailHeader?: boolean;
};

/**
 * Workbench de una parada: cargas (Recoger/Devolver/Cancelar), gating y evidencia.
 * Usado en Sheet (F6) y en el master-detail legado.
 */
export function TripTrackingStopOperationDetail({
  row,
  tripStatus,
  orderedStops,
  cargos,
  showHints,
  tripInProgress,
  pendingCargoAction,
  getCargoStatusVariant,
  onCargoAction,
  onRegisterNote,
  onRegisterIncident,
  canRegisterEvidence = false,
  canMutateCargo = true,
  compactDetailHeader = false,
}: TripTrackingStopOperationDetailProps) {
  const { primary, secondary } = formatStopTimelineLabel(
    row.stop,
    row.displayOrder,
  );
  const stopStatus = trackingStopStatusForBadge(
    row.stop.status as StopStatusValue | undefined,
  );
  const links = getStopCargoLinks(row.stop, cargos, orderedStops);
  const stopActive = canOperateCargoAtStop(row.stop, tripStatus);
  const cargoBlock = getCargoBlockAtStop(row.stop, cargos, orderedStops);
  const cargoActionsEnabled = tripInProgress && stopActive;
  return (
    <div className="space-y-4" data-tracking-section="stop-workbench">
      {compactDetailHeader ? (
        <header className="border-b pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {primary}
          </h3>
        </header>
      ) : (
        <header className="space-y-1 border-b pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{primary}</h3>
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
            <p className="text-sm text-muted-foreground">{secondary}</p>
          ) : null}
          {row.planRealLines.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-xs tabular-nums text-muted-foreground">
              {row.planRealLines.map((line) => (
                <li key={line.kind}>{line.summary}</li>
              ))}
            </ul>
          ) : null}
        </header>
      )}

      {row.nextAction === "resolve_cargo_at_stop" && cargoBlock.blocked ? (
        <DetailAlertCard
          severity="warning"
          icon={<Package className="h-4 w-4" />}
          title={
            canMutateCargo
              ? trackingCopy.hint.cargoBlockedBeforeDeparture
              : trackingCopy.hint.cargoBlockedBeforeDepartureDriver
          }
        >
          <p>
            {canMutateCargo
              ? trackingCopy.hint.cargoBlockedBody(cargoBlock.descriptions.length)
              : trackingCopy.hint.cargoBlockedBodyDriver}
          </p>
        </DetailAlertCard>
      ) : null}

      <section className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Package className="h-3.5 w-3.5 shrink-0" />
          {trackingCopy.section.cargosAtStop}
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
              const cargoFacts = trackingCopy.format.cargoFacts(
                link.cargo.weightInKg ?? link.cargo.weight,
                link.cargo.units,
              );

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
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {link.movementType === "pickup"
                            ? cargoCopy.label.pickupCompleted
                            : cargoCopy.label.deliveryCompleted}
                        </Badge>
                      ) : null}
                      {isCargoHazmat(link.cargo) ? (
                        <Badge
                          variant="warning"
                          tone="soft"
                          className="text-[10px] font-normal"
                        >
                          {trackingCopy.label.hazardous}
                        </Badge>
                      ) : null}
                    </div>
                    {cargoFacts ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cargoFacts}
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
                            showTransition={false}
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

      {canRegisterEvidence && onRegisterNote != null && onRegisterIncident != null ? (
        <section className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {trackingCopy.label.evidenceAtStop}
          </p>
          <TrackingEvidenceActions
            onRegisterNote={() => onRegisterNote(row.stop)}
            onRegisterIncident={() => onRegisterIncident(row.stop)}
            canRegisterNote={canRegisterEvidence}
            canRegisterIncident={canRegisterEvidence}
          />
        </section>
      ) : null}
    </div>
  );
}
