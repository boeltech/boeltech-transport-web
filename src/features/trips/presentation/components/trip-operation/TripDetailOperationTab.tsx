import { Link } from "react-router-dom";
import {
  Building2,
  Calendar,
  ExternalLink,
  Gauge,
  Truck,
  Users,
} from "lucide-react";

import type { ClientRef, Trip } from "@features/trips/domain";
import { formatMileage } from "@features/trips";
import { useInternalStaffEntitlement } from "@features/billing";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { Separator } from "@shared/ui/separator";

import { TripScheduleInlineEditor } from "./TripScheduleInlineEditor";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.operation;

export interface TripDetailOperationTabProps {
  /** Viaje completo (programación sincroniza `scheduledArrival` con parada destino). */
  trip: Trip;
  canEditStructural: boolean;
}

function formatTripTypeLabel(intent: Trip["cfdiDocumentIntent"]): string {
  return copy.format.tripType(intent);
}

function ClientContractCard({
  client,
  clientId,
  cfdiDocumentIntent,
}: {
  client?: ClientRef;
  clientId: string | null;
  cfdiDocumentIntent: Trip["cfdiDocumentIntent"];
}) {
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
          {client ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0" asChild>
              <Link to={`/clients/${client.id}`}>
                {copy.action.viewClient}
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {client ? (
          <InfoRow variant="inline" label={copy.label.legalName} value={client.legalName} />
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {clientId
              ? copy.format.clientUnavailableId(clientId)
              : copy.state.clientUnavailable}
          </div>
        )}
        <InfoRow
          variant="inline"
          label={copy.label.tripType}
          value={formatTripTypeLabel(cfdiDocumentIntent)}
        />
      </CardContent>
    </Card>
  );
}

export function TripDetailOperationTab({
  trip,
  canEditStructural,
}: TripDetailOperationTabProps) {
  const {
    hasModule: hasInternalStaffModule,
    isFetched: isInternalStaffEntitlementFetched,
  } = useInternalStaffEntitlement();
  const showInternalStaffEntitlementWarning =
    isInternalStaffEntitlementFetched &&
    !hasInternalStaffModule &&
    Boolean(trip.internalStaff && trip.internalStaff.length > 0);

  return (
    <div className="space-y-6">
      <ClientContractCard
        client={trip.client}
        clientId={trip.clientId}
        cfdiDocumentIntent={trip.cfdiDocumentIntent}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.assignment}
            </CardTitle>
            <CardDescription>
              {copy.hint.assignment}
            </CardDescription>
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
              <InfoRow variant="inline" label={copy.label.driver} value={trip.driver.fullName} />
            ) : (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                {copy.state.noDriver}
              </div>
            )}

            {trip.internalStaff && trip.internalStaff.length > 0 ? (
              <>
                {showInternalStaffEntitlementWarning ? (
                  <DetailAlertCard
                    severity="warning"
                    title="Módulo no activo"
                    className="my-3"
                  >
                    <p className="text-sm text-muted-foreground">
                      Este viaje incluye equipo de apoyo, pero el add-on ya no
                      está activo en tu cuenta. Los datos se muestran solo lectura.
                    </p>
                    <Button variant="link" className="mt-2 h-auto p-0" asChild>
                      <Link to="/settings/subscription">Ver plan y consumo</Link>
                    </Button>
                  </DetailAlertCard>
                ) : null}
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {copy.hint.staffSection}
                    <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                      {trip.internalStaff.length}
                    </Badge>
                  </div>
                  {trip.internalStaff.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <p className="font-medium">{member.employeeFullName}</p>
                      {member.isPaymentResponsible ? (
                        <p className="text-muted-foreground">{copy.hint.paymentResponsible}</p>
                      ) : null}
                      {member.paymentNotes ? (
                        <p className="mt-1 italic text-muted-foreground">{member.paymentNotes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
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
      </div>

      {trip.notes ? (
        <Card>
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
}
