/**
 * ClientTripHistoryTab — tabla paginada de viajes del cliente (WS-B)
 *
 * Por defecto cohorte operativa (excluye draft/cancelled), alineada a KPIs del header.
 */

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { History, Loader2, Route, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { ListingPagination } from "@shared/ui/listing";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { TripStatusBadge } from "@features/trips/presentation/config/tripStatusConfig";
import { InvoiceStatusBadge } from "@features/invoicing/presentation/components";
import type { TripStatusType } from "@features/trips/domain";
import type { InvoiceStatus } from "@features/invoicing/domain";

import { useClientTripHistory } from "../../application";
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={<Route />}
              title={copy.table.empty}
              size="sm"
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.table.trip}</TableHead>
                      <TableHead>{copy.table.route}</TableHead>
                      <TableHead>{copy.table.date}</TableHead>
                      <TableHead className="text-right">{copy.table.revenue}</TableHead>
                      <TableHead>{copy.table.source}</TableHead>
                      <TableHead>{copy.table.status}</TableHead>
                      <TableHead>{copy.table.invoice}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.tripId}>
                        <TableCell>
                          <Link
                            to={`/trips/${trip.tripId}`}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {trip.tripCode}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">
                          {formatRoute(trip.originLabel, trip.destinationLabel)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {trip.scheduledDeparture
                            ? formatDateTime(trip.scheduledDeparture)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMxCurrency(trip.revenue)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatRevenueSource(trip.revenueSource)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TripStatusBadge
                            status={trip.status as TripStatusType}
                            size="sm"
                            showIcon={false}
                          />
                        </TableCell>
                        <TableCell>{formatInvoiceStatus(trip.invoiceStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination ? (
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
