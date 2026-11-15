/**
 * ClientTripHistoryTab — tabla paginada de viajes del cliente (WS-B)
 *
 * Por defecto cohorte operativa (excluye draft/cancelled), alineada a KPIs del header.
 * Matriz: EntityListTable compact embebida (framed=false; navegación solo por link primario).
 */

import { useState, type ReactNode } from "react";
import { History, Route, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { ListingPagination } from "@shared/ui/listing";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatDateTime } from "@shared/utils/dateUtils";
import { TripStatusBadge } from "@features/trips/presentation/config/tripStatusConfig";
import { InvoiceStatusBadge } from "@features/invoicing/presentation/components";
import type { TripStatusType } from "@features/trips/domain";
import type { InvoiceStatus } from "@features/invoicing/domain";

import { useClientTripHistory } from "../../application";
import type { ClientTripHistoryItem } from "../../domain";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const copy = clientDetailCopy.history;

interface ClientTripHistoryTabProps {
  clientId: string;
}

const PAGE_SIZE = 10;

function formatRevenueSource(source: string | null): string {
  if (!source) return "—";
  return copy.revenueSource[source] ?? source.replace(/_/g, " ");
}

function formatInvoiceStatus(status: string): ReactNode {
  if (status === "none") {
    return (
      <Badge variant="outline" className="text-xs">
        {copy.invoiceStatus.none}
      </Badge>
    );
  }
  return (
    <InvoiceStatusBadge status={status as InvoiceStatus} size="sm" showIcon={false} />
  );
}

function formatRoute(origin: string | null, destination: string | null): string {
  const parts = [origin, destination].filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0]!;
  return `${origin} → ${destination}`;
}

function buildColumns(): EntityListColumnDef<ClientTripHistoryItem>[] {
  return [
    {
      id: "trip",
      header: copy.table.trip,
      kind: "primary",
      accessor: (trip) => trip.tripCode,
    },
    {
      id: "route",
      header: copy.table.route,
      kind: "text",
      className: "max-w-[220px]",
      accessor: (trip) => formatRoute(trip.originLabel, trip.destinationLabel),
    },
    {
      id: "date",
      header: copy.table.date,
      kind: "meta",
      accessor: (trip) =>
        trip.scheduledDeparture
          ? formatDateTime(trip.scheduledDeparture)
          : null,
    },
    {
      id: "revenue",
      header: copy.table.revenue,
      kind: "money",
      accessor: (trip) => trip.revenue,
    },
    {
      id: "source",
      header: copy.table.source,
      kind: "status",
      accessor: (trip) => (
        <Badge variant="outline" className="text-xs">
          {formatRevenueSource(trip.revenueSource)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: copy.table.status,
      kind: "status",
      accessor: (trip) => (
        <TripStatusBadge
          status={trip.status as TripStatusType}
          size="sm"
          showIcon={false}
        />
      ),
    },
    {
      id: "invoice",
      header: copy.table.invoice,
      kind: "status",
      accessor: (trip) => formatInvoiceStatus(trip.invoiceStatus),
    },
  ];
}

export function ClientTripHistoryTab({ clientId }: ClientTripHistoryTabProps) {
  const [page, setPage] = useState(1);
  const [includeExcluded, setIncludeExcluded] = useState(false);
  const historyQuery = useClientTripHistory(clientId, {
    page,
    limit: PAGE_SIZE,
    includeExcluded,
  });

  const trips = historyQuery.data?.data ?? [];
  const pagination = historyQuery.data?.pagination;
  const isLoading = historyQuery.isLoading;
  const columns = buildColumns();
  const isEmpty = !isLoading && trips.length === 0;

  const handleToggleExcluded = (checked: boolean) => {
    setIncludeExcluded(checked);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">{copy.title}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Viajes
              </CardTitle>
              <CardDescription>
                {pagination
                  ? `${pagination.total} viaje${pagination.total === 1 ? "" : "s"} ${
                      includeExcluded ? "registrado" : "operativo"
                    }${pagination.total === 1 ? "" : "s"}`
                  : "Listado paginado"}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                id="include-excluded-trips"
                checked={includeExcluded}
                onCheckedChange={handleToggleExcluded}
              />
              <Label htmlFor="include-excluded-trips" className="cursor-pointer text-sm">
                {copy.includeExcludedLabel}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isEmpty ? (
            <EmptyState
              icon={<Route />}
              title={copy.table.empty}
              size="sm"
            />
          ) : (
            <>
              <EntityListTable
                framed={false}
                density="compact"
                columns={columns}
                rows={trips}
                getRowId={(row) => row.tripId}
                isLoading={isLoading}
                primaryTo={(row) => `/trips/${row.tripId}`}
                aria-label={copy.title}
              />

              {pagination && !isLoading ? (
                <ListingPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientTripHistoryTab;
