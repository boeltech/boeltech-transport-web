import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock } from "lucide-react";
import { ROLES } from "@shared/constants/roles";
import { useRole } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { EmptyState } from "@shared/ui/feedback-states";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { useQueryErrorToast } from "@shared/hooks";
import {
  FINANCE_INVOICEABLE_PATH,
  FINANCE_INVOICES_PATH,
  useFinanceListingFilters,
} from "@features/finance/application";
import { buildTripsFiscalAttentionHref } from "@features/trips/application";
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
import { useHelpEmptySupport } from "@features/help-center";
import { financeCopy } from "../copy";
import {
  DEFAULT_INVOICEABLE_BUCKET,
  isInvoiceableBucket,
  type InvoiceableBucketId,
} from "../config/invoiceableWorkbenchConfig";
import { AccountantInvoiceableQueuesAlert } from "../components/AccountantInvoiceableQueuesAlert";
import {
  classifyInvoiceableBucket,
  countsFromInvoiceableSummary,
  mapInvoiceableWorkbenchBuckets,
} from "../utils/mapInvoiceableWorkbenchBuckets";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";

const copy = financeCopy.invoiceable;
const workbenchCopy = copy.workbench;
const PAGE_SIZE = 10;

// ============================================================================
// TABLE — EntityListTable workbench (Conform D1–D7)
// ============================================================================

function buildInvoiceableColumns(opts: {
  onInvoice: (trip: TripListItem) => void;
  onOpenTripInvoicing: (trip: TripListItem) => void;
}): EntityListColumnDef<TripListItem>[] {
  const { onInvoice, onOpenTripInvoicing } = opts;

  return [
    {
      id: "trip",
      header: copy.table.trip,
      kind: "primary",
      className: "font-mono",
      accessor: (trip): EntityListStackedValue => {
        const hasActiveSplit = trip.invoicing.hasActiveSplit;
        const splitProgress =
          hasActiveSplit && trip.invoicing.splitLegsTotal > 0
            ? copy.table.splitLegsProgress(
                trip.invoicing.splitLegsInvoiced,
                trip.invoicing.splitLegsTotal,
              )
            : null;
        const hasChips =
          trip.operationalOutcome === "false_trip" || hasActiveSplit;
        const secondary =
          hasChips || splitProgress ? (
            <div className="flex flex-col gap-1 whitespace-normal">
              {hasChips ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {trip.operationalOutcome === "false_trip" ? (
                    <Badge variant="warning" tone="soft" className="text-xs">
                      {copy.table.falseTripChip}
                    </Badge>
                  ) : null}
                  {hasActiveSplit ? (
                    <Badge variant="default" className="text-xs">
                      {copy.table.splitShareChip}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              {splitProgress ? <span>{splitProgress}</span> : null}
            </div>
          ) : undefined;

        return {
          primary: trip.tripCode,
          secondary,
        };
      },
    },
    {
      id: "client",
      header: copy.table.client,
      kind: "text",
      accessor: (trip) => trip.client?.legalName ?? copy.noClient,
    },
    {
      id: "route",
      header: copy.table.route,
      kind: "meta",
      accessor: (trip) => formatRoute(trip.originCity, trip.destinationCity),
    },
    {
      id: "departure",
      header: copy.table.departure,
      kind: "date",
      accessor: (trip) => trip.scheduledDeparture.toISOString(),
    },
    {
      id: "baseRate",
      header: copy.table.baseRate,
      kind: "money",
      accessor: (trip) => trip.baseRate,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      className: "w-auto",
      headerClassName: "w-0",
      accessor: (trip) => {
        const isBlocked = classifyInvoiceableBucket(trip) === "blocked";
        const blockReason =
          isBlocked && trip.invoicing.blockReason
            ? trip.invoicing.blockReason
            : null;

        if (shouldOpenInvoiceCreateFromFinanceHub(trip)) {
          return (
            <Button
              size="sm"
              onClick={() => onInvoice(trip)}
              data-help-anchor="inv-facturar-row"
            >
              {copy.invoiceAction}
            </Button>
          );
        }

        return (
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
        );
      },
    },
  ];
}

function InvoiceableTripsTable({
  trips,
  isLoading,
  onInvoice,
  onOpenTripInvoicing,
  primaryState,
}: {
  trips: TripListItem[];
  isLoading: boolean;
  onInvoice: (trip: TripListItem) => void;
  onOpenTripInvoicing: (trip: TripListItem) => void;
  primaryState: () => unknown;
}) {
  const columns = useMemo(
    () => buildInvoiceableColumns({ onInvoice, onOpenTripInvoicing }),
    [onInvoice, onOpenTripInvoicing],
  );

  return (
    <EntityListTable
      density="list"
      aria-label={copy.title}
      columns={columns}
      rows={trips}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={(trip) => buildTripInvoicingHubPath(trip.id)}
      primaryState={primaryState}
    />
  );
}

// ============================================================================
// PAGE — WorkbenchPageShell (ADR-0090)
// ============================================================================

export function FinanceInvoiceablePage() {
  const navigate = useNavigate();
  const queueFromState = useInvoiceQueueFromState();
  const role = useRole();
  const isAccountant = role === ROLES.ACCOUNTANT;

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
        blockedDescription: isAccountant
          ? workbenchCopy.bucketDescriptions.blockedAccountant
          : undefined,
      }),
    [activeBucket, counts, handleBucketChange, isAccountant],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchSummary()]);
  }, [refetch, refetchSummary]);

  const handleInvoice = useCallback(
    (trip: TripListItem) => {
      navigate(buildInvoiceCreatePathFromTrip(trip), {
        state: queueFromState,
      });
    },
    [navigate, queueFromState],
  );

  const handleOpenTripInvoicing = useCallback(
    (trip: TripListItem) => {
      navigate(buildTripInvoicingHubPath(trip.id), {
        state: queueFromState,
      });
    },
    [navigate, queueFromState],
  );

  const primaryState = useCallback(() => queueFromState, [queueFromState]);

  const isDegraded = isError && !isLoading;
  const emptyBucket = workbenchCopy.emptyByBucket[activeBucket];
  const listLoading = isLoading || summaryLoading;
  const hasSearch = Boolean(filters.search.trim());
  const helpEmpty = useHelpEmptySupport(FINANCE_INVOICEABLE_PATH, !hasSearch);

  return (
    <WorkbenchPageShell
      title={copy.title}
      description={
        isAccountant ? copy.descriptionAccountant : copy.description
      }
      beforeAwareness={
        isAccountant ? <AccountantInvoiceableQueuesAlert /> : undefined
      }
      buckets={buckets}
      bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
      bucketsLoading={summaryLoading}
      isDegraded={isDegraded}
      degradedMessage={workbenchCopy.degradedMessage}
      degradedHref={FINANCE_INVOICES_PATH}
      degradedLinkLabel={workbenchCopy.degradedLinkLabel}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.searchPlaceholder,
          ariaLabel: copy.searchAriaLabel,
          className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
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
            <InvoiceableTripsTable
              trips={[]}
              isLoading
              onInvoice={handleInvoice}
              onOpenTripInvoicing={handleOpenTripInvoicing}
              primaryState={primaryState}
            />
          );
        }

        if (trips.length === 0) {
          const showAccountantEmpty = isAccountant && !hasSearch;
          const productDescription = hasSearch
            ? copy.empty.withFilters
            : showAccountantEmpty
              ? copy.empty.accountantDescription
              : emptyBucket.description;
          return (
            <EmptyState
              icon={
                <FileClock className="h-10 w-10 text-muted-foreground" />
              }
              title={
                hasSearch
                  ? copy.empty.title
                  : showAccountantEmpty
                    ? copy.empty.accountantTitle
                    : emptyBucket.title
              }
              description={
                !hasSearch && helpEmpty
                  ? helpEmpty.phrase
                  : productDescription
              }
              secondaryCta={
                hasSearch
                  ? {
                      label: copy.empty.clearFilters,
                      onClick: filters.clearAll,
                      variant: "outline" as const,
                    }
                  : helpEmpty
                    ? helpEmpty.viewHelpCta
                    : showAccountantEmpty
                      ? {
                          label: copy.empty.accountantFiscalAttentionCta,
                          onClick: () =>
                            navigate(buildTripsFiscalAttentionHref()),
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
            primaryState={primaryState}
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
        href: FINANCE_INVOICES_PATH,
        description: isAccountant
          ? workbenchCopy.relatedConfig.descriptionAccountant
          : workbenchCopy.relatedConfig.description,
      }}
    />
  );
}
