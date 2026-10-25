import type {
  CfdiEmissionIntent,
  TripCargo,
  TripOperationalOutcomeType,
  TripStatusType,
  TripStop,
} from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";

import type { CargoManualAction } from "../../utils/cargoStatusActions";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import {
  TripTrackingObjectiveHub,
  type TrackingContactInfo,
} from "./TripTrackingObjectiveHub";
import { trackingCopy } from "./trackingCopy";

export type { TrackingContactInfo };

export type TripTrackingNowPanelProps = {
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
  onGoToCargos?: (stopId: string) => void;
  /** F3 / D6: mutación de carga desde Operate. */
  onCargoAction?: (cargoId: string, action: CargoManualAction) => void;
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  /** Evidencia en overflow ⋯ (PD5). */
  onRegisterNote?: () => void;
  onRegisterIncident?: () => void;
  canRegisterNote?: boolean;
  canRegisterIncident?: boolean;
  canOperateTracking?: boolean;
  canMutateCargo?: boolean;
  isDriverPortal?: boolean;
  isClientPortal?: boolean;
  contact?: TrackingContactInfo | null;
  /** PD12 — deep-link a tab Ruta. */
  onGoToRouteTab?: () => void;
  className?: string;
};

/**
 * Zona Operate (layout A): «Qué sigue» + 1 CTA `default` + ⋯.
 * Mapa/bitácora viven en Consulta (TripTrackingTab). Incidente = franja full-width.
 */
export function TripTrackingNowPanel({
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
  canOperateTracking = true,
  canMutateCargo,
  isDriverPortal = false,
  isClientPortal = false,
  contact = null,
  onGoToRouteTab,
  className,
}: TripTrackingNowPanelProps) {
  const showMidTripRouteHint =
    !isClientPortal &&
    tripStatus === TripStatus.IN_PROGRESS &&
    onGoToRouteTab != null;

  return (
    <div
      className={cn("min-w-0 space-y-3", className)}
      data-tracking-section="operate"
      aria-label={trackingCopy.section.operate}
    >
      <TripTrackingObjectiveHub
        compact
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
        onGoToCargos={onGoToCargos}
        onCargoAction={onCargoAction}
        pendingCargoAction={pendingCargoAction}
        onRegisterNote={onRegisterNote}
        onRegisterIncident={onRegisterIncident}
        canRegisterNote={canRegisterNote}
        canRegisterIncident={canRegisterIncident}
        contact={contact}
        onGoToRouteTab={onGoToRouteTab}
        showMidTripRouteHint={showMidTripRouteHint}
        canOperateTracking={canOperateTracking}
        canMutateCargo={canMutateCargo}
        isDriverPortal={isDriverPortal}
        isClientPortal={isClientPortal}
      />
    </div>
  );
}
