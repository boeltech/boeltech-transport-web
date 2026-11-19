import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ExternalLink, Truck } from "lucide-react";

import type { Trip, TripStatusHistory } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { useTripExpenses } from "@features/trips/application";
import { useDrivers } from "@features/drivers/application";
import { useBranch } from "@features/branches/application";
import {
  SETTLEMENTS_LIST_PATH,
  settlementCreatePath,
} from "@features/settlements/application";
import { usePermissions } from "@shared/permissions";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";

import { TripRouteTypeInlineEditor } from "./TripRouteTypeInlineEditor";
import { TripResumenActivityRail } from "./TripResumenActivityRail";
import { TripResumenBillingRail } from "./TripResumenBillingRail";
import { TripResumenFleetGpsStatus } from "./TripResumenFleetGpsStatus";
import { TripResumenResultRail } from "./TripResumenResultRail";
import { TripResumenScheduleCard } from "./TripResumenScheduleCard";
import { TripFleetAssignmentSheet } from "../trip-fleet-assignment";
import { TripOrderCard } from "../trip-order";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
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
        className="cursor-pointer gap-0.5 text-[10px] hover:bg-accent"
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
  /** Administrador o gerente: legado F1; CP snapshot vive en Facturación (F5). */
  canSubstituteInvoice?: boolean;
  statusHistory?: readonly TripStatusHistory[];
}

function formatTripTypeLabel(
  trip: Trip,
): string {
  if (trip.cfdiEmissionIntent === "sin_cfdi_efectivo") {
    return cfdiEmissionIntentCopy.options.sin_cfdi_efectivo;
  }
  return copy.format.tripType(trip.cfdiDocumentIntent);
}

function KvRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-1.5 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

function ClientContractCard({
  trip,
  showClientLink,
  canEditRouteType,
  originBranchName,
}: {
  trip: Trip;
  showClientLink: boolean;
  canEditRouteType: boolean;
  originBranchName: string | null;
}) {
  const { id: tripId, client } = trip;
  const isSinCfdi = trip.cfdiEmissionIntent === "sin_cfdi_efectivo";

  return (
    <Card data-testid="trip-operation-client-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{copy.section.client}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        {client ? (
          <KvRow label={copy.label.legalName}>
            {showClientLink ? (
              <Link
                to={`/clients/${client.id}`}
                state={{ from: `/trips/${tripId}` }}
                className="text-primary hover:underline"
              >
                {client.legalName}
              </Link>
            ) : (
              client.legalName
            )}
          </KvRow>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {copy.state.clientUnavailable}
          </div>
        )}
        <KvRow label={copy.label.tripType}>
          {isSinCfdi ? (
            <Badge variant="warning" tone="soft" className="text-[10px]">
              {formatTripTypeLabel(trip)}
            </Badge>
          ) : (
            formatTripTypeLabel(trip)
          )}
        </KvRow>
        <TripRouteTypeInlineEditor
          trip={trip}
          readOnly={!canEditRouteType}
          presentation="row"
        />
        <KvRow label={copy.label.originBranch}>
          {originBranchName ?? copy.state.noOriginBranch}
        </KvRow>
      </CardContent>
    </Card>
  );
}

/**
 * Tab Resumen (ex Operación) — D6 / F2: 2 columnas + riel.
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
  const canReadExpenses = hasPermission("expenses", "read");
  const isCompleted = trip.status === TripStatus.COMPLETED;
  const isCancelled = trip.status === TripStatus.CANCELLED;
  const showSettlementActions =
    isCompleted && !isClientPortalView && !isCancelled;
  const canEditSchedule =
    canEditStructural && !isCancelled && !isClientPortalView;
  const canShowReassign =
    canReassignFleet && !isCancelled && !isClientPortalView;

  const handleFleetAssignmentSheetOpenChange = (open: boolean) => {
    setIsFleetAssignmentSheetOpen(open);
    if (!open && openAssignFleetFromAlert) {
      setSearchParams((prev) => clearAssignFleetSearchParams(prev), {
        replace: true,
      });
    }
  };

  const setTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
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

  const { data: expenses = [] } = useTripExpenses(trip.id, {
    enabled: !isClientPortalView && canReadExpenses,
  });

  const { data: originBranch } = useBranch(trip.originBranchId ?? "");

  const driversData = driversPage?.data;
  const titularEmployeeId = useMemo(() => {
    if (!resolvedDriverId || !driversData) return null;
    return (
      driversData.find((driver) => driver.id === resolvedDriverId)?.employeeId ??
      null
    );
  }, [resolvedDriverId, driversData]);

  const tripSettlementsSearchHref = `${SETTLEMENTS_LIST_PATH}?search=${encodeURIComponent(trip.tripCode)}`;
  const originBranchName = originBranch?.name ?? null;
  const driverPhone = trip.driver?.phone?.trim() || null;

  const mainColumn = (
    <div className="space-y-6 min-w-0">
      {!isClientPortalView ? (
        <Card data-testid="trip-operation-fleet-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{copy.section.assignment}</CardTitle>
              <CardDescription>
                {isCancelled
                  ? copy.hint.cancelledFleetReadOnly
                  : copy.hint.assignment}
              </CardDescription>
            </div>
            {canShowReassign ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsFleetAssignmentSheetOpen(true)}
                className="shrink-0 gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                {trip.vehicle || trip.driver
                  ? copy.action.reassignFleet
                  : copy.action.assignFleet}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">{copy.label.unit}</p>
                {trip.vehicle ? (
                  <>
                    <p className="text-sm font-medium">{trip.vehicle.unitNumber}</p>
                    {trip.vehicle.licensePlate ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        {trip.vehicle.licensePlate}
                      </p>
                    ) : null}
                    <TripResumenFleetGpsStatus vehicleId={trip.vehicleId} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {copy.state.noVehicle}
                  </p>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {copy.label.trailers}
                </p>
                {trip.trailers && trip.trailers.length > 0 ? (
                  trip.trailers
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((trailer) => (
                      <div key={`${trailer.trailerId}-${trailer.position}`}>
                        <p className="font-mono text-sm font-medium">
                          {copy.format.trailerLine(
                            trailer.position,
                            trailer.licensePlate,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {copy.rail.trailerPosition(trailer.position)}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {copy.state.noTrailers}
                  </p>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {copy.label.driver}
                  </p>
                  {showSettlementActions &&
                  canCreateSettlement &&
                  titularEmployeeId ? (
                    <SettlementLiquidateLink employeeId={titularEmployeeId} />
                  ) : null}
                </div>
                {trip.driver ? (
                  <>
                    <p className="text-sm font-medium">{trip.driver.fullName}</p>
                    {driverPhone ? (
                      <>
                        <p className="font-mono text-xs text-muted-foreground">
                          {driverPhone}
                        </p>
                        <a
                          href={`tel:${driverPhone.replace(/\s+/g, "")}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {copy.action.callDriver}
                        </a>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {copy.state.noDriver}
                  </p>
                )}
              </div>
            </div>

            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-3 text-sm"
              data-testid="trip-operation-staff-card"
            >
              <span className="text-muted-foreground">
                {copy.format.staffSupportLine(trip.internalStaff?.length ?? 0)}
              </span>
              {trip.internalStaff && trip.internalStaff.length > 0 ? (
                trip.internalStaff.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex flex-wrap items-baseline gap-x-2"
                  >
                    <span className="font-medium">{member.employeeFullName}</span>
                    <span className="text-muted-foreground">
                      {copy.format.staffRole(member.internalRole)}
                      {member.isPaymentResponsible
                        ? ` · ${copy.hint.paymentResponsible}`
                        : null}
                    </span>
                    {showSettlementActions && canCreateSettlement ? (
                      <SettlementLiquidateLink employeeId={member.employeeId} />
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {copy.state.noSupportStaff}
                </span>
              )}
              {showSettlementActions && canReadSettlements ? (
                <Link
                  to={tripSettlementsSearchHref}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {copy.action.viewTripSettlements}
                  <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <TripResumenScheduleCard
        trip={trip}
        canEdit={canEditSchedule && showMileage}
      />

      <ClientContractCard
        trip={trip}
        showClientLink={showClientLink}
        canEditRouteType={
          canEditRouteType && !isClientPortalView && !isCancelled
        }
        originBranchName={originBranchName}
      />

      <TripOrderCard
        trip={trip}
        isClientPortalView={isClientPortalView}
        isDriverPortalView={isDriverPortalView}
      />

      {!isClientPortalView ? (
        <Card data-testid="trip-operation-notes-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{copy.section.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              {trip.notes?.trim() ? trip.notes : copy.hint.notesEmpty}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );

  const railColumn = !isClientPortalView ? (
    <div className="space-y-6 xl:sticky xl:top-24">
      <TripResumenResultRail
        trip={trip}
        expenses={expenses}
        canReadCosts={canReadExpenses}
        onOpenCostsTab={() => setTab("costs")}
      />
      <TripResumenBillingRail
        trip={trip}
        onOpenBillingTab={() => setTab("billing")}
      />
      <TripResumenActivityRail
        entries={statusHistory ?? trip.statusHistory}
      />
    </div>
  ) : (
    <div className="space-y-6 xl:sticky xl:top-24">
      <TripResumenActivityRail
        entries={statusHistory ?? trip.statusHistory}
      />
    </div>
  );

  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      data-testid="trip-detail-operation-tab"
    >
      {mainColumn}
      {railColumn}

      {!isClientPortalView && canShowReassign && isFleetSheetOpen ? (
        <TripFleetAssignmentSheet
          trip={trip}
          open={isFleetSheetOpen}
          onOpenChange={handleFleetAssignmentSheetOpenChange}
        />
      ) : null}
    </div>
  );
}
