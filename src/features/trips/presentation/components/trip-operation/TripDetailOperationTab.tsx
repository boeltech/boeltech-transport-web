import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  Phone,
  Truck,
} from "lucide-react";

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
import { InfoRow } from "@shared/ui/data-display";
import { Separator } from "@shared/ui/separator";

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.client}
            </CardTitle>
            <CardDescription className="mt-1.5">
              {isSinCfdi ? copy.hint.sinCfdiClient : copy.hint.client}
            </CardDescription>
          </div>
          {showClientLink && client ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              asChild
            >
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
      <CardContent className="space-y-1 pt-0">
        {client ? (
          <InfoRow
            variant="inline"
            label={copy.label.legalName}
            value={
              showClientLink ? (
                <Link
                  to={`/clients/${client.id}`}
                  state={{ from: `/trips/${tripId}` }}
                  className="text-primary hover:underline"
                >
                  {client.legalName}
                </Link>
              ) : (
                client.legalName
              )
            }
          />
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {copy.state.clientUnavailable}
          </div>
        )}
        <InfoRow
          variant="inline"
          label={copy.label.tripType}
          value={
            isSinCfdi ? (
              <Badge variant="warning" tone="soft" className="text-[10px]">
                {formatTripTypeLabel(trip)}
              </Badge>
            ) : (
              formatTripTypeLabel(trip)
            )
          }
        />
        <div className="pt-2">
          <TripRouteTypeInlineEditor
            trip={trip}
            readOnly={!canEditRouteType}
          />
        </div>
        <InfoRow
          variant="inline"
          label={copy.label.originBranch}
          value={originBranchName ?? copy.state.noOriginBranch}
        />
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                {copy.section.assignment}
              </CardTitle>
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
          <CardContent className="space-y-3 pt-0">
            {trip.vehicle ? (
              <div className="space-y-1">
                <InfoRow
                  variant="inline"
                  label={copy.label.unit}
                  value={
                    <span className="font-medium">
                      {trip.vehicle.unitNumber}
                      {trip.vehicle.licensePlate
                        ? ` · ${trip.vehicle.licensePlate}`
                        : null}
                    </span>
                  }
                />
                <TripResumenFleetGpsStatus vehicleId={trip.vehicleId} />
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                {copy.state.noVehicle}
              </div>
            )}

            <Separator />

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

            <Separator />

            {trip.driver ? (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <InfoRow
                    variant="inline"
                    label={copy.label.driver}
                    value={trip.driver.fullName}
                  />
                  {driverPhone ? (
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden />
                        {driverPhone}
                      </span>
                      <a
                        href={`tel:${driverPhone.replace(/\s+/g, "")}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {copy.action.callDriver}
                      </a>
                    </p>
                  ) : null}
                </div>
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

            <Separator />

            <div
              className="space-y-2"
              data-testid="trip-operation-staff-card"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {copy.hint.staffSection}
                {trip.internalStaff && trip.internalStaff.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-[10px] font-normal"
                  >
                    {trip.internalStaff.length}
                  </Badge>
                ) : null}
              </div>
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
                        {member.isPaymentResponsible
                          ? ` · ${copy.hint.paymentResponsible}`
                          : null}
                      </p>
                      {member.paymentNotes ? (
                        <p className="mt-1 italic text-muted-foreground">
                          {member.paymentNotes}
                        </p>
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

              {showSettlementActions && canReadSettlements ? (
                <div className="pt-1">
                  <Link
                    to={tripSettlementsSearchHref}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {copy.action.viewTripSettlements}
                    <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden />
                  </Link>
                </div>
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
