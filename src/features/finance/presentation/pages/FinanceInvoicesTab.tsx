import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { usePermissions } from "@shared/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useFinanceInvoicesList,
  useFinanceListingFilters,
  useFinanceSummary,
} from "@features/finance/application";
import type {
  FinanceInvoiceListItem,
  FinanceInvoiceStatus,
} from "@features/finance/domain";
import {
  FinanceInvoiceListTable,
  FinanceInvoicesSummaryCards,
} from "../components";
import { FINANCE_INVOICES_PAGE_SIZE } from "../config/financeInvoiceListConfig";
import { financeCopy } from "../copy";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../utils/financeInvoiceFromTripCta";

interface FinanceInvoicesTabProps {
  showFinanceSummaryMetrics: boolean;
}

const invoiceStatusLabels = financeCopy.invoices.statusLabels;

export function FinanceInvoicesTab({
  showFinanceSummaryMetrics,
}: FinanceInvoicesTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);

  const filters = useFinanceListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) =>
        financeCopy.invoices.filters.chipLabel(
          invoiceStatusLabels[value as FinanceInvoiceStatus] ?? value,
        ),
    },
  });

  const statusFilter = filters.filters.status as FinanceInvoiceStatus | "";

  const { data, isLoading, isError, error, refetch, isFetching } =
    useFinanceInvoicesList({
      search: filters.search || undefined,
      status: statusFilter || undefined,
      page: filters.page,
      limit: FINANCE_INVOICES_PAGE_SIZE,
    });

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary({
    enabled: showFinanceSummaryMetrics,
  });

  const invoices = data?.data ?? [];

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: "destructive",
        title: financeCopy.invoices.toasts.loadError,
        description: getErrorMessage(error),
      });
    }
  }, [isError, error, toast]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: financeCopy.invoices.toasts.refreshed, variant: "success" });
  }, [refetch, toast]);

  const handleKpiStatus = useCallback(
    (status: FinanceInvoiceStatus) => {
      const current = filters.filters.status;
      filters.setFilter("status", current === status ? "" : status);
    },
    [filters],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/invoices/${id}`, {
        state: { from: "/finance?tab=invoices" },
      });
    },
    [navigate],
  );

  const kpiStrip =
    showFinanceSummaryMetrics ? (
      <FinanceInvoicesSummaryCards
        stamped={summary?.invoicesByStatus.stamped ?? 0}
        draft={summary?.invoicesByStatus.draft ?? 0}
        cancellationPending={summary?.invoicesByStatus.cancellationPending ?? 0}
        cancelled={summary?.invoicesByStatus.cancelled ?? 0}
        totalReceivable={summary?.totalReceivable ?? 0}
        isLoading={summaryLoading}
        activeStatus={statusFilter}
        onFilterStatus={handleKpiStatus}
      />
    ) : undefined;

  return (
    <ListPageShell<FinanceInvoiceListItem>
      title={financeCopy.invoices.title}
      showHeader={false}
      beforeToolbar={kpiStrip}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: financeCopy.invoices.searchPlaceholder,
        },
        filters: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              filters.setFilter("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-44" aria-label={financeCopy.invoices.filters.statusPlaceholder}>
              <SelectValue placeholder={financeCopy.invoices.filters.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{financeCopy.invoices.filters.all}</SelectItem>
              {(Object.keys(invoiceStatusLabels) as FinanceInvoiceStatus[]).map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {invoiceStatusLabels[status]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        ),
        extraActions: canInvoiceFromTrip ? (
          <Button
            variant="outline"
            onClick={() => navigate(FINANCE_INVOICE_FROM_TRIP_CTA.tripsPath)}
            title={FINANCE_INVOICE_FROM_TRIP_CTA.tooltip}
          >
            <Receipt className="h-4 w-4 mr-2" />
            {FINANCE_INVOICE_FROM_TRIP_CTA.label}
          </Button>
        ) : undefined,
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips,
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters,
      }}
      isLoading={isLoading}
      items={invoices}
      pagination={
        data?.pagination
          ? {
              page: filters.page,
              totalPages: data.pagination.totalPages,
              total: data.pagination.total,
              limit: data.pagination.limit,
            }
          : undefined
      }
      onPageChange={filters.setPage}
      entityLabelPlural={financeCopy.invoices.entityLabelPlural}
      renderTable={() => (
        <FinanceInvoiceListTable
          invoices={invoices}
          isLoading={isLoading}
          onView={handleView}
        />
      )}
      emptyState={{
        icon: <FileText className="h-10 w-10 text-muted-foreground" />,
        title: financeCopy.invoices.empty.title,
        description: filters.hasFilters
          ? financeCopy.invoices.empty.withFilters
          : FINANCE_INVOICE_FROM_TRIP_CTA.emptyDescription,
        cta: canInvoiceFromTrip
          ? {
              label: FINANCE_INVOICE_FROM_TRIP_CTA.label,
              icon: <Receipt className="h-4 w-4" />,
              onClick: () => navigate(FINANCE_INVOICE_FROM_TRIP_CTA.tripsPath),
            }
          : undefined,
        secondaryCta: filters.hasFilters
          ? {
              label: financeCopy.invoices.empty.clearFilters,
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
