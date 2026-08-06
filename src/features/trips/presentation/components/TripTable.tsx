/**
 * TripTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tabla del listado de viajes: operación primero, factura secundaria.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import type { TripListItem } from "../../domain";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { tripsListCopy } from "../copy/listCopy";
import { getTripInvoicingBadgeConfig } from "../uiHelpers";
import { TripActions } from "./TripActions";
import { TripListRouteLabel } from "./TripListRouteLabel";
import { TripOverdueBadge } from "./TripOverdueBadge";
import { formatDate, formatTime } from "@shared/utils/dateUtils";

interface TripTableProps {
  trips: TripListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  /** Portal cliente: oculta columna Cliente (siempre es el mismo). */
  hideClientColumn?: boolean;
  /** Portal cliente: oculta badge operativo «Requiere atención». */
  hideFiscalAttentionBadge?: boolean;
}

const copy = tripsListCopy.columns;

type HeaderKey =
  | "code"
  | "client"
  | "route"
  | "vehicle"
  | "driver"
  | "departure"
  | "status"
  | "invoice"
  | "actions";

function getTableHeaders(hideClientColumn: boolean) {
  const headers: { key: HeaderKey; label: string; className?: string }[] = [
    { key: "code", label: copy.code },
  ];
  if (!hideClientColumn) {
    headers.push({ key: "client", label: copy.client });
  }
  headers.push(
    { key: "route", label: copy.route },
    { key: "vehicle", label: copy.vehicle },
    { key: "driver", label: copy.driver },
    { key: "departure", label: copy.departure },
    { key: "status", label: copy.status },
    { key: "invoice", label: copy.invoice },
    { key: "actions", label: "", className: "w-12" },
  );
  return headers;
}

function TableHeaderRow({ hideClientColumn }: { hideClientColumn: boolean }) {
  const headers = getTableHeaders(hideClientColumn);
  return (
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton({ hideClientColumn }: { hideClientColumn: boolean }) {
  const headers = getTableHeaders(hideClientColumn);
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {headers.map((header) => (
            <TableCell key={header.key}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState({ hideClientColumn }: { hideClientColumn: boolean }) {
  const headers = getTableHeaders(hideClientColumn);
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={headers.length} className="h-24 text-center">
          {tripsListCopy.empty.table}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function TripTable({
  trips,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onSchedule,
  onCancel,
  hideClientColumn = false,
  hideFiscalAttentionBadge = false,
}: TripTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow hideClientColumn={hideClientColumn} />
          <LoadingSkeleton hideClientColumn={hideClientColumn} />
        </Table>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow hideClientColumn={hideClientColumn} />
          <EmptyState hideClientColumn={hideClientColumn} />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow hideClientColumn={hideClientColumn} />
        <TableBody>
          {trips.map((trip) => {
            const invoicingConfig = getTripInvoicingBadgeConfig(trip);

            return (
              <TableRow
                key={trip.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(trip.id)}
              >
                <TableCell className="font-mono font-medium">
                  {trip.tripCode}
                </TableCell>

                {!hideClientColumn ? (
                  <TableCell>
                    {trip.client?.legalName ?? copy.noClient}
                  </TableCell>
                ) : null}

                <TableCell>
                  <TripListRouteLabel
                    trip={trip}
                    className="font-medium leading-snug"
                  />
                </TableCell>

                <TableCell>
                  {trip.vehicle?.unitNumber ? (
                    <div className="space-y-0.5">
                      <p>{trip.vehicle.unitNumber}</p>
                      {trip.vehicle.licensePlate ? (
                        <p className="font-mono text-xs text-muted-foreground">
                          {trip.vehicle.licensePlate}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    copy.emptyCell
                  )}
                </TableCell>

                <TableCell>
                  {trip.driver?.fullName || copy.emptyCell}
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <p>
                      {formatDate(
                        trip.scheduledDeparture.toISOString().split("T")[0],
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(trip.scheduledDeparture.toISOString())}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TripStatusBadge status={trip.status} size="sm" showIcon />
                    <TripOverdueBadge trip={trip} />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!hideFiscalAttentionBadge &&
                    trip.requiresFiscalAttention ? (
                      <Badge variant="destructive" tone="soft">
                        {tripsListCopy.badge.fiscalAttention}
                      </Badge>
                    ) : null}
                    <Badge variant={invoicingConfig.variant}>
                      {invoicingConfig.label}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TripActions
                    trip={trip}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSchedule={onSchedule}
                    onCancel={onCancel}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
