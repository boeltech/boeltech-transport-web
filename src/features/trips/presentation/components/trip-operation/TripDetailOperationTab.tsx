import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  ExternalLink,
  Gauge,
  Truck,
  Users,
} from "lucide-react";

import type { Trip, TripStatusHistory } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { formatMileage } from "@features/trips";
import { useDrivers } from "@features/drivers/application";
import {
  SETTLEMENTS_LIST_PATH,
  settlementCreatePath,
} from "@features/settlements/application";
import { usePermissions } from "@shared/permissions";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Separator } from "@shared/ui/separator";

import { TripScheduleInlineEditor } from "./TripScheduleInlineEditor";
import { TripRouteTypeInlineEditor } from "./TripRouteTypeInlineEditor";
import { TripDetailStatusHistory } from "./TripDetailStatusHistory";
import { TripFleetAssignmentSheet } from "../trip-fleet-assignment";
import { TripFleetSnapshotCard } from "../trip-fleet-snapshot";
import { TripOrderCard } from "../trip-order";
import { tripDetailCopy } from "../../copy";
import {
  clearAssignFleetSearchParams,
  wantsOpenAssignFleetSheet,
} from "../../pages/tripDetailAssignFleetParams";

const copy = tripDetailCopy.operation;

function SettlementLiquidateLink({ employeeId }: { employeeId: string }) {
  return (
    <Link
      to={settlementCreatePath({ employeeId })}
      className="inline-flex shrink-0"
      title={copy.action.liquidateEmployeeHint}
      aria-label={copy.action.liquidateEmployeeHint}
    >
      <Badge
        variant="outline"
        className="text-[10px] hover:bg-accent cursor-pointer gap-0.5"
      >
        {copy.action.liquidateEmployee}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </Badge>
    </Link>
  );
}

export interface TripDetailOperationTabProps {
  /** Viaje completo (programación sincroniza `scheduledArrival` con parada destino). */
  trip: Trip;
  canEditStructural: boolean;
  /** Editable hasta liquidación pagada (CEO-1 / F0 patch route_type). */
  canEditRouteType?: boolean;
  /** ADR-0093 — reasignar flota mid-trip (independiente de structural). */
  canReassignFleet?: boolean;
  /** Portal cliente: sin enlace al módulo Clientes. */
  showClientLink?: boolean;
  /** Portal cliente: sin kilometraje inicial/final. */
  showMileage?: boolean;
  /** Portal cliente: oculta asignación, staff interno y notas operativas. */
  isClientPortalView?: boolean;
  /** Portal conductor: oculta Orden de viaje (documento de despacho). */
  isDriverPortalView?: boolean;
  /** Administrador o gerente: «Sustituir factura» en el aviso de datos para Carta Porte. */
  canSubstituteInvoice?: boolean;
  statusHistory?: readonly TripStatusHistory[];
}

function formatTripTypeLabel(intent: Trip["cfdiDocumentIntent"]): string {
  return copy.format.tripType(intent);
}

function ClientContractCard({
  trip,
  showClientLink,
  canEditRouteType,
}: {
  trip: Trip;
  showClientLink: boolean;
  canEditRouteType: boolean;
}) {
  const { id: tripId, client, cfdiDocumentIntent } = trip;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.client}
            </CardTitle>
            <CardDescription className="mt-1.5">
              {copy.hint.client}
            </CardDescription>
          </div>
          {showClientLink && client ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0" asChild>
              <Link
                to={`/clients/${client.id}`}
                state={{ from: `/trips/${tripId}` }}
              >
                {copy.action.viewClient}
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {client ? (
          <InfoRow variant="inline" label={copy.label.legalName} value={client.legalName} />
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {copy.state.clientUnavailable}
          </div>
        )}
        <InfoRow
          variant="inline"
          label={copy.label.tripType}
          value={formatTripTypeLabel(cfdiDocumentIntent)}
        />
        <div className="pt-2">
          <TripRouteTypeInlineEditor
            trip={trip}
            readOnly={!canEditRouteType}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tab Operación — ficha patio-first (Ola 2 #1 / D7):
 * Flota → Programación → Cliente → staff → Orden → Datos CP → km/notas/historial.
 */
export function TripDetailOperationTab({
  trip,
  canEditStructural,
  canEditRouteType = false,
  canReassignFleet = false,
  showClientLink = true,
  showMileage = true,
  isClientPortalView = false,
  isDriverPortalView = false,
  canSubstituteInvoice = false,
  statusHistory,
}: TripDetailOperationTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFleetAssignmentSheetOpen, setIsFleetAssignmentSheetOpen] =
    useState(false);
  const openAssignFleetFromAlert =
    canReassignFleet && wantsOpenAssignFleetSheet(searchParams);
  const isFleetSheetOpen =
    isFleetAssignmentSheetOpen || openAssignFleetFromAlert;
  const { hasPermission } = usePermissions();
  const canCreateSettlement = hasPermission("settlements", "create");
  const canReadSettlements = hasPermission("settlements", "read");
  const isCompleted = trip.status === TripStatus.COMPLETED;
  const showSettlementActions = isCompleted && !isClientPortalView;

  const handleFleetAssignmentSheetOpenChange = (open: boolean) => {
    setIsFleetAssignmentSheetOpen(open);
    if (!open && openAssignFleetFromAlert) {
      setSearchParams((prev) => clearAssignFleetSearchParams(prev), {
        replace: true,
      });
    }
  };

  const resolvedDriverId = trip.driverId || trip.driver?.id;

  const { data: driversPage } = useDrivers(
    { page: 1, limit: 100 },
    {
      enabled:
        showSettlementActions &&
        canCreateSettlement &&
        Boolean(resolvedDriverId),
    },
  );

  const driversData = driversPage?.data;
  const titularEmployeeId = useMemo(() => {
    if (!resolvedDriverId || !driversData) return null;
    return (
      driversData.find((driver) => driver.id === resolvedDriverId)?.employeeId ??
      null
    );
  }, [resolvedDriverId, driversData]);

  const tripSettlementsSearchHref = `${SETTLEMENTS_LIST_PATH}?search=${encodeURIComponent(trip.tripCode)}`;

  return (
    <div className="space-y-6" data-testid="trip-detail-operation-tab">
      {/* D7 — 1. Flota y tripulación (oculta en portal cliente) */}
      {!isClientPortalView ? (
        <Card data-testid="trip-operation-fleet-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                {copy.section.assignment}
              </CardTitle>
              <CardDescription>
                {copy.hint.assignment}
              </CardDescription>
            </div>
            {canReassignFleet ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsFleetAssignmentSheetOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <Truck className="h-3.5 w-3.5" />
                {trip.vehicle || trip.driver
                  ? copy.action.reassignFleet
                  : copy.action.assignFleet}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="pt-0">
            {trip.vehicle ? (
              <>
                <InfoRow variant="inline" label={copy.label.unit} value={trip.vehicle.unitNumber} />
                <InfoRow variant="inline" label={copy.label.plate} value={trip.vehicle.licensePlate} />
              </>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                {copy.state.noVehicle}
              </div>
            )}

            <Separator className="my-3" />

            {trip.driver ? (
              <div className="flex items-start justify-between gap-2">
                <InfoRow variant="inline" label={copy.label.driver} value={trip.driver.fullName} />
                {showSettlementActions &&
                canCreateSettlement &&
                titularEmployeeId ? (
                  <SettlementLiquidateLink employeeId={titularEmployeeId} />
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                {copy.state.noDriver}
              </div>
            )}

            <Separator className="my-3" />

            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {copy.hint.trailersSection}
              </div>
              {trip.trailers && trip.trailers.length > 0 ? (
                trip.trailers
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((trailer) => (
                    <div
                      key={`${trailer.trailerId}-${trailer.position}`}
                      className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <p className="font-medium">
                        {copy.format.trailerLine(
                          trailer.position,
                          trailer.licensePlate,
                        )}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  {copy.state.noTrailers}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* D7 — 2. Programación */}
      <Card data-testid="trip-operation-schedule-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            {copy.section.schedule}
          </CardTitle>
          <CardDescription>
            {copy.hint.schedule}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <TripScheduleInlineEditor trip={trip} readOnly={!canEditStructural} />
          {trip.actualDeparture ? (
            <InfoRow
              variant="inline"
              label={copy.label.actualDeparture}
              value={formatDateTime(trip.actualDeparture.toISOString())}
            />
          ) : null}
          {trip.actualArrival ? (
            <InfoRow
              variant="inline"
              label={copy.label.actualArrival}
              value={formatDateTime(trip.actualArrival.toISOString())}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* D7 — 3. Cliente / contrato */}
      <div data-testid="trip-operation-client-card">
        <ClientContractCard
          trip={trip}
          showClientLink={showClientLink}
          canEditRouteType={canEditRouteType && !isClientPortalView}
        />
      </div>

      {/* D7 — 4. Staff interno (oculta en portal cliente) */}
      {!isClientPortalView ? (
        <Card data-testid="trip-operation-staff-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              {copy.hint.staffSection}
              {trip.internalStaff && trip.internalStaff.length > 0 ? (
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  {trip.internalStaff.length}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {trip.internalStaff && trip.internalStaff.length > 0 ? (
                trip.internalStaff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{member.employeeFullName}</p>
                      <p className="text-muted-foreground">
                        {copy.format.staffRole(member.internalRole)}
                      </p>
                      {member.isPaymentResponsible ? (
                        <p className="text-muted-foreground">{copy.hint.paymentResponsible}</p>
                      ) : null}
                      {member.paymentNotes ? (
                        <p className="mt-1 italic text-muted-foreground">{member.paymentNotes}</p>
                      ) : null}
                    </div>
                    {showSettlementActions && canCreateSettlement ? (
                      <SettlementLiquidateLink employeeId={member.employeeId} />
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  {copy.state.noSupportStaff}
                </div>
              )}
            </div>

            {showSettlementActions && canReadSettlements ? (
              <>
                <Separator className="my-3" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5 text-primary" />
                      {copy.settlement.sectionTitle}
                    </span>
                    <Link to={tripSettlementsSearchHref}>
                      <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                        {copy.action.viewTripSettlements}
                        <ExternalLink className="ml-1.5 h-3 w-3 inline" aria-hidden />
                      </Badge>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* D7 — 5. Orden de viaje · 6. Datos Carta Porte (una Card cada una; D9) */}
      <TripOrderCard
        trip={trip}
        isClientPortalView={isClientPortalView}
        isDriverPortalView={isDriverPortalView}
      />

      <TripFleetSnapshotCard
        trip={trip}
        isClientPortalView={isClientPortalView}
        canSubstituteInvoice={canSubstituteInvoice}
      />

      {/* D7 — 7. km / notas / historial */}
      {showMileage ? (
        <Card data-testid="trip-operation-mileage-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.mileage}
            </CardTitle>
            <CardDescription>
              {copy.hint.mileage}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label={copy.label.mileageStart} value={formatMileage(trip.mileage.start)} />
            <InfoRow variant="inline" label={copy.label.mileageEnd} value={formatMileage(trip.mileage.end)} />
          </CardContent>
        </Card>
      ) : null}

      {!isClientPortalView && trip.notes ? (
        <Card data-testid="trip-operation-notes-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{copy.section.notes}</CardTitle>
            <CardDescription>{copy.hint.notes}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              {trip.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <TripDetailStatusHistory entries={statusHistory ?? trip.statusHistory} />

      {!isClientPortalView && canReassignFleet ? (
        <TripFleetAssignmentSheet
          trip={trip}
          open={isFleetSheetOpen}
          onOpenChange={handleFleetAssignmentSheetOpenChange}
        />
      ) : null}
    </div>
  );
}
