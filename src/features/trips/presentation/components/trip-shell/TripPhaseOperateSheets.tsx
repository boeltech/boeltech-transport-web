/**
 * Host de sheets de fase abiertos desde Qué sigue (HB-G2-CTA / D3 / D37).
 * Mutación solo dentro del sheet. Anatomía D36 («Al confirmar») en cada sheet F3.
 */

import { useEffect, useMemo, useState } from "react";

import { useTripTimeline } from "@features/trips";
import {
  getOrderedStops,
  type CfdiEmissionIntent,
  type TripCargo,
  type TripStatusType,
} from "@features/trips/domain";
import { usePermissions, useRole } from "@shared/permissions";
import { isDriverPortalRole } from "@shared/constants/roles";

import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  findOriginAwaitingDeparture,
  isOriginStop,
} from "../trackingStopEligibility";
import { resolveTrackingPrimaryAction } from "../trip-tracking/trackingNextAction";
import { StartTripSheet } from "../trip-tracking/StartTripSheet";
import { RegisterTripArrivalSheet } from "../trip-tracking/RegisterTripArrivalSheet";
import { RegisterStopTrackingEventSheet } from "../trip-tracking/RegisterStopTrackingEventSheet";
import { DepartOriginSheet } from "../trip-tracking/DepartOriginSheet";

export type TripPhaseOperateSheetsProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  driverId?: string;
  tripStartMileage?: number | null;
  originBranchId?: string | null;
  status: TripStatusType;
  cargos: readonly TripCargo[];
  cfdiEmissionIntent?: CfdiEmissionIntent;
  pendingSinCfdiRequest?: boolean;
  requiresFiscalAttention?: boolean;
  originNoCargoPendingOutcome?: boolean;
  returnReplanRequired?: boolean;
  /** Cuando true, abre el sheet que corresponde a la acción de fase. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si la acción no es un sheet (cargo_blocked / idle), navega a Seguimiento. */
  onFallbackToTracking?: () => void;
};

export function TripPhaseOperateSheets({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  originBranchId,
  status,
  cargos,
  cfdiEmissionIntent,
  pendingSinCfdiRequest,
  requiresFiscalAttention,
  originNoCargoPendingOutcome = false,
  returnReplanRequired = false,
  open,
  onOpenChange,
  onFallbackToTracking,
}: TripPhaseOperateSheetsProps) {
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isDriverPortal = isDriverPortalRole(role);
  const canUpdateTrip = hasPermission("trips", "update");
  const canOperateTracking =
    canUpdateTrip ||
    hasPermission("trips", "updateStatus") ||
    hasPermission("trips", "execute");
  const canMutateCargo = canUpdateTrip;

  const timelineQuery = useTripTimeline(tripId, {
    enabled: Boolean(tripId) && open,
  });
  const timeline = timelineQuery.data;
  const orderedStops = useMemo(
    () => (timeline ? getOrderedStops(timeline.stops) : []),
    [timeline],
  );
  const tripStatus =
    timeline?.trip.status === status ? timeline.trip.status : status;

  const primaryKind = useMemo(
    () =>
      resolveTrackingPrimaryAction(tripStatus, orderedStops, cargos, {
        canMutateCargo,
        originNoCargoPendingOutcome,
        returnReplanRequired,
      }).kind,
    [
      tripStatus,
      orderedStops,
      cargos,
      canMutateCargo,
      originNoCargoPendingOutcome,
      returnReplanRequired,
    ],
  );

  const [startOpen, setStartOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [departOriginOpen, setDepartOriginOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setStartOpen(false);
      setArrivalOpen(false);
      setDepartureOpen(false);
      setDepartOriginOpen(false);
      setCloseOpen(false);
      return;
    }
    if (!timeline || timelineQuery.isLoading) return;
    if (!canOperateTracking) {
      onOpenChange(false);
      return;
    }

    if (primaryKind === "dispatch") {
      setStartOpen(true);
      return;
    }
    if (primaryKind === "arrive") {
      setArrivalOpen(true);
      return;
    }
    if (primaryKind === "depart") {
      setDepartureOpen(true);
      return;
    }
    if (primaryKind === "depart_origin") {
      setDepartOriginOpen(true);
      return;
    }
    if (primaryKind === "close") {
      setCloseOpen(true);
      return;
    }

    onOpenChange(false);
    onFallbackToTracking?.();
  }, [
    open,
    timeline,
    timelineQuery.isLoading,
    primaryKind,
    canOperateTracking,
    onOpenChange,
    onFallbackToTracking,
  ]);

  const closeAll = (next: boolean) => {
    if (next) return;
    setStartOpen(false);
    setArrivalOpen(false);
    setDepartureOpen(false);
    setDepartOriginOpen(false);
    setCloseOpen(false);
    onOpenChange(false);
  };

  if (!canOperateTracking) return null;

  const originStop = orderedStops.find((stop) => isOriginStop(stop));
  const nextStopForArrival = findNextStopForArrival(orderedStops);
  const activeEscalaForDeparture = findActiveEscalaForDeparture(orderedStops);
  const originAwaitingDeparture = findOriginAwaitingDeparture(orderedStops);
  const destinationAwaitingClosure =
    findDestinationAwaitingTripArrival(orderedStops);

  const nextArrivalOrder = nextStopForArrival
    ? orderedStops.findIndex((s) => s.id === nextStopForArrival.id) + 1
    : undefined;
  const activeDepartureOrder = activeEscalaForDeparture
    ? orderedStops.findIndex((s) => s.id === activeEscalaForDeparture.id) + 1
    : undefined;
  const originDepartureOrder = originAwaitingDeparture
    ? orderedStops.findIndex((s) => s.id === originAwaitingDeparture.id) + 1
    : undefined;
  const destinationClosureOrder = destinationAwaitingClosure
    ? orderedStops.findIndex((s) => s.id === destinationAwaitingClosure.id) + 1
    : undefined;

  return (
    <>
      <StartTripSheet
        tripId={tripId}
        tripCode={tripCode}
        vehicleId={vehicleId}
        driverId={driverId}
        tripStartMileage={tripStartMileage}
        originStop={originStop}
        originBranchId={originBranchId}
        cfdiEmissionIntent={cfdiEmissionIntent}
        pendingSinCfdiRequest={pendingSinCfdiRequest}
        cargos={cargos}
        orderedStops={orderedStops}
        open={startOpen}
        onOpenChange={closeAll}
        isDriverPortal={isDriverPortal}
      />
      <RegisterStopTrackingEventSheet
        tripId={tripId}
        mode="arrival"
        stop={nextStopForArrival ?? null}
        displayOrder={nextArrivalOrder}
        open={arrivalOpen}
        onOpenChange={closeAll}
      />
      <RegisterStopTrackingEventSheet
        tripId={tripId}
        mode="departure"
        stop={activeEscalaForDeparture ?? null}
        displayOrder={activeDepartureOrder}
        cargos={cargos}
        orderedStops={orderedStops}
        open={departureOpen}
        onOpenChange={closeAll}
      />
      <DepartOriginSheet
        tripId={tripId}
        originStop={originAwaitingDeparture ?? originStop ?? null}
        displayOrder={originDepartureOrder ?? (originStop ? 1 : undefined)}
        cargos={cargos}
        orderedStops={orderedStops}
        open={departOriginOpen}
        onOpenChange={closeAll}
      />
      {timeline ? (
        <RegisterTripArrivalSheet
          tripId={tripId}
          tripCode={tripCode}
          tripStartMileage={tripStartMileage}
          plannedDistanceKm={timeline.progress.distancePlannedKm}
          scheduledDeparture={timeline.trip.scheduledDeparture ?? undefined}
          actualDeparture={timeline.trip.actualDeparture ?? undefined}
          destinationStop={destinationAwaitingClosure ?? null}
          displayOrder={destinationClosureOrder}
          cargos={cargos}
          orderedStops={orderedStops}
          cfdiEmissionIntent={cfdiEmissionIntent}
          requiresFiscalAttention={requiresFiscalAttention}
          hasOpenIncident={timeline.trip.hasOpenIncident}
          isDriverPortal={isDriverPortal}
          open={closeOpen}
          onOpenChange={closeAll}
        />
      ) : null}
    </>
  );
}
