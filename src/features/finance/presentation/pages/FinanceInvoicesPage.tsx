import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { useAuth } from "@features/auth";
import { isClientPortalRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { InvoiceableTripPickerSheet } from "@features/trips";
import { useQueryErrorToast, useToast } from "@shared/hooks";
import { EmptyState } from "@shared/ui/feedback-states";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import {
  isFinanceAnalyticsEnabled,
  useFinanceInvoicesList,
  useFinanceListingFilters,
  useFinanceSummary,
} from "@features/finance/application";
import type { FinanceInvoiceStatus } from "@features/finance/domain";
import { FinanceInvoiceListTable } from "../components";
import { FINANCE_INVOICES_PAGE_SIZE } from "../config/financeInvoiceListConfig";
import {
  bucketToInvoiceStatus,
  DEFAULT_INVOICES_BUCKET,
  isInvoicesWorkbenchBucket,
  type InvoicesWorkbenchBucketId,
} from "../config/invoicesWorkbenchConfig";
import { financeCopy } from "../copy";
import { canShowInvoiceFromTripCta } from "@features/invoicing";
import type { TripListItem } from "@features/trips/domain";
import { resolveFinanceInvoicesTabTripTarget } from "../utils/financeInvoiceFromTripCta";
import {
  countsFromFinanceSummary,
  mapInvoicesWorkbenchBuckets,
} from "../utils/mapInvoicesWorkbenchBuckets";

const INVOICES_PAGE_PATH = "/finance/invoices";

const copy = financeCopy.invoices;
const workbenchCopy = copy.workbench;
const newInvoiceCta = copy.newInvoiceCta;

export function FinanceInvoicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClientPortal = isClientPortalRole(user?.role);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const showWorkbenchBuckets = isFinanceAnalyticsEnabled({
    isClientPortal,
    hasFinanceRead: hasPermission("finance", "read"),
  });
  const canInvoiceFromTrip =
    !isClientPortal && canShowInvoiceFromTripCta(hasPermission);
  const [pickerOpen, setPickerOpen] = useState(false);

  const filters = useFinanceListingFilters<"bucket">({
    filters: { bucket: {} },
    chipLabels: {
      bucket: (value) =>
        `Estado: ${copy.statusLabels[value as FinanceInvoiceStatus] ?? value}`,
    },
  });

  const activeBucket: InvoicesWorkbenchBucketId = isInvoicesWorkbenchBucket(
    filters.filters.bucket,
  )
    ? filters.filters.bucket
    : DEFAULT_INVOICES_BUCKET;

  const statusFilter = bucketToInvoiceStatus(activeBucket);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useFinanceInvoicesList(
      {
        search: filters.search || undefined,
        status: statusFilter,
        page: filters.page,
        limit: FINANCE_INVOICES_PAGE_SIZE,
      },
      { enabled: true },
    );

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary({
    enabled: showWorkbenchBuckets,
  });

  const { data: stampingData, isLoading: stampingLoading } =
    useFinanceInvoicesList(
      { status: "stamping", page: 1, limit: 1 },
      { enabled: showWorkbenchBuckets },
    );

  const invoices = useMemo(() => data?.data ?? [], [data?.data]);

  useQueryErrorToast({
    isError,
    error,
    title: copy.toasts.loadError,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toasts.refreshed, variant: "success" });
  }, [refetch, toast]);

  const handleBucketChange = useCallback(
    (bucket: InvoicesWorkbenchBucketId) => {
      filters.setFilter("bucket", bucket === DEFAULT_INVOICES_BUCKET ? "" : bucket);
    },
    [filters],
  );

  const bucketCounts = useMemo(
    () =>
      countsFromFinanceSummary(summary, {
        stampingCount: stampingData?.pagination?.total ?? 0,
      }),
    [summary, stampingData?.pagination?.total],
  );

  const buckets = useMemo(
    () =>
      showWorkbenchBuckets
        ? mapInvoicesWorkbenchBuckets({
            counts: bucketCounts,
            activeBucket,
            onBucketChange: handleBucketChange,
          })
        : [],
    [
      showWorkbenchBuckets,
      bucketCounts,
      activeBucket,
      handleBucketChange,
    ],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/invoices/${id}`, {
        state: { from: INVOICES_PAGE_PATH },
      });
    },
    [navigate],
  );

  const handleTripSelected = useCallback(
    (trip: TripListItem) => {
      navigate(resolveFinanceInvoicesTabTripTarget(trip), {
        state: { from: INVOICES_PAGE_PATH },
      });
    },
    [navigate],
  );

  return (
    <>
      <WorkbenchPageShell
        title={
          isClientPortal
            ? financeCopy.page.portal.invoicesTab
            : copy.title
        }
        description={
          isClientPortal ? financeCopy.page.portal.subtitle : undefined
        }
        primaryAction={{
          label: newInvoiceCta.label,
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setPickerOpen(true),
          visible: canInvoiceFromTrip,
        }}
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
        bucketsLoading={summaryLoading || stampingLoading}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: isClientPortal
              ? copy.searchPlaceholderClient
              : copy.searchPlaceholder,
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
          if (isLoading) {
            return (
              <FinanceInvoiceListTable
                invoices={[]}
                isLoading
                onView={handleView}
                isClientPortal={isClientPortal}
              />
            );
          }

          if (invoices.length === 0) {
            return (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title={copy.empty.title}
                description={
                  filters.hasFilters
                    ? copy.empty.withFilters
                    : isClientPortal
                      ? copy.empty.noDataClient
                      : newInvoiceCta.emptyDescription
                }
                cta={
                  canInvoiceFromTrip
                    ? {
                        label: newInvoiceCta.label,
                        icon: <Plus className="h-4 w-4" />,
                        onClick: () => setPickerOpen(true),
                      }
                    : undefined
                }
                secondaryCta={
                  filters.hasFilters
                    ? {
                        label: copy.empty.clearFilters,
                        onClick: filters.clearAll,
                        variant: "outline",
                      }
                    : undefined
                }
              />
            );
          }

          return (
            <FinanceInvoiceListTable
              invoices={invoices}
              isLoading={false}
              onView={handleView}
              isClientPortal={isClientPortal}
            />
          );
        }}
        pagination={
          data?.pagination
            ? {
                page: filters.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit ?? FINANCE_INVOICES_PAGE_SIZE,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        relatedConfig={
          canInvoiceFromTrip
            ? {
                label: workbenchCopy.relatedConfig.label,
                href: "/finance/invoiceable",
                description: workbenchCopy.relatedConfig.description,
              }
            : undefined
        }
      />
      {canInvoiceFromTrip ? (
        <InvoiceableTripPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleTripSelected}
        />
      ) : null}
    </>
  );
}
