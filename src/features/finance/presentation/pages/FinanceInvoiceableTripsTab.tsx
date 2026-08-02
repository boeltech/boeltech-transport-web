import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useToast } from "@shared/hooks";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useFinanceListingFilters } from "@features/finance/application";
import { useTrips, formatRoute } from "@features/trips";
import type { TripListItem } from "@features/trips/domain";
import { financeCopy } from "../copy";

const copy = financeCopy.invoiceable;
const PAGE_SIZE = 10;
/** Origen para el back del formulario de factura. */
const TAB_PATH = "/finance?tab=invoiceable";

interface FinanceInvoiceableTripsTabProps {
  queriesEnabled: boolean;
}

const TABLE_HEADERS = [
  { key: "trip", label: copy.table.trip },
  { key: "client", label: copy.table.client },
  { key: "route", label: copy.table.route },
  { key: "departure", label: copy.table.departure },
  { key: "baseRate", label: copy.table.baseRate, className: "text-right" },
  { key: "action", label: "", className: "w-0" },
];

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function InvoiceableTripsTable({
  trips,
  isLoading,
  onInvoice,
}: {
  trips: TripListItem[];
  isLoading: boolean;
  onInvoice: (tripId: string) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        {isLoading ? (
          <LoadingSkeleton />
        ) : trips.length === 0 ? (
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={TABLE_HEADERS.length}
                className="h-24 text-center"
              >
                {copy.table.empty}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-mono font-medium">
                  {trip.tripCode}
                </TableCell>
                <TableCell className="text-sm">
                  {trip.client?.legalName ?? copy.noClient}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRoute(trip.originCity, trip.destinationCity)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(
                    trip.scheduledDeparture.toISOString().split("T")[0],
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMxCurrency(trip.baseRate)}
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => onInvoice(trip.id)}>
                    {copy.invoiceAction}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

export function FinanceInvoiceableTripsTab({
  queriesEnabled,
}: FinanceInvoiceableTripsTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const filters = useFinanceListingFilters({ filters: {} });

  const { data, isLoading, isError, error, refetch, isFetching } = useTrips(
    {
      page: filters.page,
      limit: PAGE_SIZE,
      filters: {
        invoiceableOnly: true,
        search: filters.search || undefined,
      },
      sort: { field: "scheduled_departure", direction: "desc" },
    },
    { enabled: queriesEnabled },
  );

  const trips = data?.data ?? [];

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: "destructive",
        title: copy.loadError,
        description: getErrorMessage(error),
      });
    }
  }, [isError, error, toast]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleInvoice = useCallback(
    (tripId: string) => {
      navigate(`/invoices/new?trip_id=${tripId}`, {
        state: { from: TAB_PATH },
      });
    },
    [navigate],
  );

  return (
    <ListPageShell<TripListItem>
      title={copy.title}
      showHeader={false}
      beforeToolbar={
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      }
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.searchPlaceholder,
        },
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips,
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters,
      }}
      isLoading={isLoading}
      items={trips}
      pagination={
        data?.pagination
          ? {
              page: filters.page,
              totalPages: data.pagination.totalPages,
              total: data.pagination.total,
              limit: data.pagination.limit ?? PAGE_SIZE,
            }
          : undefined
      }
      onPageChange={filters.setPage}
      entityLabelPlural={copy.entityLabelPlural}
      renderTable={() => (
        <InvoiceableTripsTable
          trips={trips}
          isLoading={isLoading}
          onInvoice={handleInvoice}
        />
      )}
      emptyState={{
        icon: <FileClock className="h-10 w-10 text-muted-foreground" />,
        title: copy.empty.title,
        description: filters.hasFilters
          ? copy.empty.withFilters
          : copy.empty.description,
        secondaryCta: filters.hasFilters
          ? {
              label: copy.empty.clearFilters,
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
