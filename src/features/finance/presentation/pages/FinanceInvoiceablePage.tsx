import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { EmptyState } from "@shared/ui/feedback-states";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { useQueryErrorToast } from "@shared/hooks";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useFinanceListingFilters } from "@features/finance/application";
import {
  useTrips,
  useInvoiceableWorkbenchSummary,
  formatRoute,
} from "@features/trips";
import type { TripListItem } from "@features/trips/domain";
import {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  shouldOpenInvoiceCreateFromFinanceHub,
} from "@features/invoicing";
import { financeCopy } from "../copy";
import {
  DEFAULT_INVOICEABLE_BUCKET,
  isInvoiceableBucket,
  type InvoiceableBucketId,
} from "../config/invoiceableWorkbenchConfig";
import {
  classifyInvoiceableBucket,
  countsFromInvoiceableSummary,
  mapInvoiceableWorkbenchBuckets,
} from "../utils/mapInvoiceableWorkbenchBuckets";

const copy = financeCopy.invoiceable;
const workbenchCopy = copy.workbench;
const PAGE_SIZE = 10;
const PAGE_PATH = "/finance/invoiceable";

// ============================================================================
// TABLE
// ============================================================================

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
  onOpenTripInvoicing,
}: {
  trips: TripListItem[];
  isLoading: boolean;
  onInvoice: (trip: TripListItem) => void;
  onOpenTripInvoicing: (trip: TripListItem) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <TableBody>
            {trips.map((trip) => {
              const hasActiveSplit = trip.invoicing.hasActiveSplit;
              const isBlocked = classifyInvoiceableBucket(trip) === "blocked";
              const blockReason =
                isBlocked && trip.invoicing.blockReason
                  ? trip.invoicing.blockReason
                  : null;
              const splitProgress =
                hasActiveSplit && trip.invoicing.splitLegsTotal > 0
                  ? copy.table.splitLegsProgress(
                      trip.invoicing.splitLegsInvoiced,
                      trip.invoicing.splitLegsTotal,
                    )
                  : null;

              return (
                <TableRow key={trip.id}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{trip.tripCode}</span>
                        {trip.operationalOutcome === "false_trip" ? (
                          <Badge
                            variant="warning"
                            tone="soft"
                            className="text-xs"
                          >
                            {copy.table.falseTripChip}
                          </Badge>
                        ) : null}
                        {hasActiveSplit ? (
                          <Badge variant="default" className="text-xs">
                            {copy.table.splitShareChip}
                          </Badge>
                        ) : null}
                      </div>
                      {splitProgress ? (
                        <span className="text-xs font-normal text-muted-foreground">
                          {splitProgress}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {trip.client?.legalName ?? copy.noClient}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRoute(trip.originCity, trip.destinationCity)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(trip.scheduledDeparture.toISOString())}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMxCurrency(trip.baseRate)}
                  </TableCell>
                  <TableCell>
                    {shouldOpenInvoiceCreateFromFinanceHub(trip) ? (
                      <Button size="sm" onClick={() => onInvoice(trip)}>
                        {copy.invoiceAction}
                      </Button>
                    ) : (
                      <div className="flex max-w-[14rem] flex-col items-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          title={blockReason ?? undefined}
                          onClick={() => onOpenTripInvoicing(trip)}
                        >
                          {copy.goToTripInvoicing}
                        </Button>
                        {blockReason ? (
                          <span className="text-xs font-normal text-muted-foreground text-right">
                            {blockReason}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

// ============================================================================
// PAGE — WorkbenchPageShell (ADR-0090)
// ============================================================================

export function FinanceInvoiceablePage() {
  const navigate = useNavigate();

  const filters = useFinanceListingFilters<"bucket">({
    filters: { bucket: {} },
    chipLabels: {
      bucket: (value) =>
        `Etapa: ${workbenchCopy.buckets[value as InvoiceableBucketId] ?? value}`,
    },
  });

  const activeBucket: InvoiceableBucketId = isInvoiceableBucket(
    filters.filters.bucket,
  )
    ? filters.filters.bucket
    : DEFAULT_INVOICEABLE_BUCKET;

  const { data, isLoading, isError, error, refetch, isFetching } = useTrips({
    page: filters.page,
    limit: PAGE_SIZE,
    filters: {
      invoiceableOnly: true,
      invoiceableBucket: activeBucket,
      search: filters.search || undefined,
    },
    sort: { field: "scheduled_departure", direction: "desc" },
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useInvoiceableWorkbenchSummary(filters.search || undefined);

  const trips = data?.data ?? [];

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadError,
  });

  const counts = useMemo(
    () =>
      summary
        ? countsFromInvoiceableSummary(summary)
        : { ready: 0, proration_pending: 0, blocked: 0 },
    [summary],
  );

  const handleBucketChange = useCallback(
    (bucket: InvoiceableBucketId) => {
      filters.setFilter("bucket", bucket);
    },
    [filters],
  );

  const buckets = useMemo(
    () =>
      mapInvoiceableWorkbenchBuckets({
        counts,
        activeBucket,
        onBucketChange: handleBucketChange,
      }),
    [activeBucket, counts, handleBucketChange],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchSummary()]);
  }, [refetch, refetchSummary]);

  const handleInvoice = useCallback(
    (trip: TripListItem) => {
      navigate(buildInvoiceCreatePathFromTrip(trip), {
        state: { from: PAGE_PATH },
      });
    },
    [navigate],
  );

  const handleOpenTripInvoicing = useCallback(
    (trip: TripListItem) => {
      navigate(buildTripInvoicingHubPath(trip.id), {
        state: { from: PAGE_PATH },
      });
    },
    [navigate],
  );

  const isDegraded = isError && !isLoading;
  const emptyBucket = workbenchCopy.emptyByBucket[activeBucket];
  const listLoading = isLoading || summaryLoading;

  return (
    <WorkbenchPageShell
      title={copy.title}
      description={copy.description}
      buckets={buckets}
      bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
      bucketsLoading={summaryLoading}
      isDegraded={isDegraded}
      degradedMessage={workbenchCopy.degradedMessage}
      degradedHref="/finance/invoices"
      degradedLinkLabel={workbenchCopy.degradedLinkLabel}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.searchPlaceholder,
        },
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips.filter(
          (chip) => chip.id !== "bucket",
        ),
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters,
      }}
      renderContent={() => {
        if (listLoading) {
          return (
            <div className="rounded-md border">
              <Table>
                <TableHeaderRow />
                <LoadingSkeleton />
              </Table>
            </div>
          );
        }

        if (trips.length === 0) {
          return (
            <EmptyState
              icon={
                <FileClock className="h-10 w-10 text-muted-foreground" />
              }
              title={
                filters.hasFilters ? copy.empty.title : emptyBucket.title
              }
              description={
                filters.hasFilters
                  ? copy.empty.withFilters
                  : emptyBucket.description
              }
              secondaryCta={
                filters.hasFilters
                  ? {
                      label: copy.empty.clearFilters,
                      onClick: filters.clearAll,
                      variant: "outline" as const,
                    }
                  : undefined
              }
            />
          );
        }

        return (
          <InvoiceableTripsTable
            trips={trips}
            isLoading={false}
            onInvoice={handleInvoice}
            onOpenTripInvoicing={handleOpenTripInvoicing}
          />
        );
      }}
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
      relatedConfig={{
        label: workbenchCopy.relatedConfig.label,
        href: "/finance/invoices",
        description: workbenchCopy.relatedConfig.description,
      }}
    />
  );
}
