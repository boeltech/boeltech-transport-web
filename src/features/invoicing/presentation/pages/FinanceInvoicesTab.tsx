import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useListingFilters, useToast } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useInvoices,
  useFinanceSummary,
} from "@features/invoicing/application";
import {
  InvoiceStatusLabels,
  type InvoiceListItem,
  type InvoiceStatus,
} from "@features/invoicing/domain";
import { InvoiceTable, InvoicesSummaryCards } from "../components";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../financeInvoiceFromTripCta";

interface FinanceInvoicesTabProps {
  showFinanceSummaryMetrics: boolean;
}

export function FinanceInvoicesTab({
  showFinanceSummaryMetrics,
}: FinanceInvoicesTabProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);

  const filters = useListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) =>
        `Estado: ${InvoiceStatusLabels[value as InvoiceStatus] ?? value}`,
    },
  });

  const statusFilter = filters.filters.status as InvoiceStatus | "";

  const { data, isLoading, isError, error, refetch, isFetching } = useInvoices({
    search: filters.search || undefined,
    status: statusFilter || undefined,
    page: filters.page,
    limit: 20,
  });

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary({
    enabled: showFinanceSummaryMetrics,
  });

  const invoices = data?.data ?? [];

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: "destructive",
        title: "Error al cargar facturas",
        description: getErrorMessage(error),
      });
    }
  }, [isError, error, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const tab = prev.get("tab");
      if (tab) next.set("tab", tab);
      return next;
    });
  }, [setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  const handleKpiStatus = useCallback(
    (status: InvoiceStatus) => {
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
      <InvoicesSummaryCards
        stamped={summary?.invoicesByStatus.stamped ?? 0}
        draft={summary?.invoicesByStatus.draft ?? 0}
        cancellationPending={
          summary?.invoicesByStatus.cancellationPending ?? 0
        }
        cancelled={summary?.invoicesByStatus.cancelled ?? 0}
        totalReceivable={summary?.totalReceivable ?? 0}
        isLoading={summaryLoading}
        activeStatus={statusFilter}
        onFilterStatus={handleKpiStatus}
      />
    ) : undefined;

  return (
    <ListPageShell<InvoiceListItem>
      title="Facturas"
      showHeader={false}
      beforeToolbar={kpiStrip}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: "Buscar por cliente, RFC, folio...",
        },
        filters: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              filters.setFilter("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(InvoiceStatusLabels) as InvoiceStatus[]).map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {InvoiceStatusLabels[status]}
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
        onClearFilters: handleClearFilters,
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
      entityLabelPlural="facturas"
      renderTable={() => (
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          onView={handleView}
        />
      )}
      emptyState={{
        icon: <FileText className="h-10 w-10 text-muted-foreground" />,
        title: "No se encontraron facturas",
        description: filters.hasFilters
          ? "Intenta ajustar los filtros de búsqueda"
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
              label: "Limpiar filtros",
              onClick: handleClearFilters,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
