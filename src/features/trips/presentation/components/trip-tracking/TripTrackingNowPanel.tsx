import { Phone, Truck, User } from "lucide-react";

import type {
  CfdiEmissionIntent,
  TripCargo,
  TripOperationalOutcomeType,
  TripStatusType,
  TripStop,
} from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import { TrackingEvidenceActions } from "./TrackingEvidenceActions";
import { TripTrackingObjectiveHub } from "./TripTrackingObjectiveHub";
import { trackingCopy } from "./trackingCopy";

export type TrackingContactInfo = {
  driverName?: string | null;
  vehicleLabel?: string | null;
  /** Teléfono operativo del conductor; si falta, fila «No capturado» y sin «Llamar». */
  driverPhone?: string | null;
};

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
  /** Evidencia al alcance (D1): sin scrollear a historial. */
  onRegisterNote?: () => void;
  onRegisterIncident?: () => void;
  canRegisterNote?: boolean;
  canRegisterIncident?: boolean;
  canOperateTracking?: boolean;
  canMutateCargo?: boolean;
  isDriverPortal?: boolean;
  isClientPortal?: boolean;
  contact?: TrackingContactInfo | null;
  className?: string;
};

/**
 * F6/F7 panel «Ahora»: qué sigue (1 CTA) + evidencia + contacto flota.
 * Incidente abierto vive en franja full-width (F7.2), no aquí.
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
  onRegisterNote,
  onRegisterIncident,
  canRegisterNote = false,
  canRegisterIncident = false,
  canOperateTracking = true,
  canMutateCargo,
  isDriverPortal = false,
  isClientPortal = false,
  contact = null,
  className,
}: TripTrackingNowPanelProps) {
  const driverName = contact?.driverName?.trim() || null;
  const vehicleLabel = contact?.vehicleLabel?.trim() || null;
  const driverPhone = contact?.driverPhone?.trim() || null;
  const hasContact = Boolean(driverName || vehicleLabel);
  const showEvidence =
    onRegisterNote != null &&
    onRegisterIncident != null &&
    !isClientPortal;

  return (
    <div
      className={cn("min-w-0 space-y-3", className)}
      data-tracking-section="now"
      aria-label={trackingCopy.section.now}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {trackingCopy.section.now}
      </p>

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
        canOperateTracking={canOperateTracking}
        canMutateCargo={canMutateCargo}
        isDriverPortal={isDriverPortal}
        isClientPortal={isClientPortal}
      />

      {showEvidence ? (
        <div
          className="space-y-1.5"
          data-tracking-section="evidence-now"
        >
          <p className="text-xs text-muted-foreground">
            {trackingCopy.hint.evidenceNow}
          </p>
          <TrackingEvidenceActions
            onRegisterNote={onRegisterNote}
            onRegisterIncident={onRegisterIncident}
            canRegisterNote={canRegisterNote}
            canRegisterIncident={canRegisterIncident}
          />
        </div>
      ) : null}

      {hasContact ? (
        <div
          className="rounded-lg border bg-card px-3 py-2.5 space-y-2"
          data-tracking-section="contact"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {trackingCopy.section.contact}
          </p>
          <ul className="space-y-1.5 text-sm">
            {driverName ? (
              <li className="flex items-center gap-2 min-w-0">
                <User
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate">
                  <span className="text-muted-foreground">
                    {trackingCopy.label.operator}:{" "}
                  </span>
                  {driverName}
                </span>
              </li>
            ) : null}
            {/* Operador → Celular → Unidad (PRD Contacto) */}
            {driverName || vehicleLabel ? (
              <li className="flex items-center gap-2 min-w-0">
                <Phone
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate">
                  <span className="text-muted-foreground">
                    {trackingCopy.label.mobile}:{" "}
                  </span>
                  {driverPhone ? (
                    <span className="select-all">{driverPhone}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {trackingCopy.label.mobileNotCaptured}
                    </span>
                  )}
                </span>
              </li>
            ) : null}
            {vehicleLabel ? (
              <li className="flex items-center gap-2 min-w-0">
                <Truck
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate">
                  <span className="text-muted-foreground">
                    {trackingCopy.label.unit}:{" "}
                  </span>
                  {vehicleLabel}
                </span>
              </li>
            ) : null}
          </ul>
          {driverPhone ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <a href={`tel:${driverPhone}`}>
                <Phone className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {trackingCopy.action.call}
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
