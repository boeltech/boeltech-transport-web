/**
 * Cola Enviadas del workbench Envío de facturas (F4 / F5).
 * Listado stamped + email_dispatch=sent con selección multi-cliente.
 * Batch CTA → `requestResend` abre Sheet mode=resend (F3).
 * Row Reenviar → SendInvoiceDialog (alreadySent).
 * Filtro opcional de periodo de emisión (dateFrom/dateTo).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { useQueryErrorToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { ListingDateRangeFilter } from "@shared/ui/listing";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useFinanceListingFilters } from "@features/finance/application";
import { SendInvoiceDialog, useInvoices } from "@features/invoicing";
import type { InvoiceListItem } from "@features/invoicing/domain";
import {
  DISPATCH_SENT_PAGE_SIZE,
  DISPATCH_TAB_PARAM,
} from "../config/dispatchWorkbenchConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchSentTable } from "./FinanceDispatchSentTable";

const copy = dispatchRunsCopy.workbench.sent;

function SentResendBar({
  count,
  onResend,
}: {
  count: number;
  onResend: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">{copy.selectedHint}</p>
      <Button type="button" onClick={onResend}>
        <Send className="mr-2 h-4 w-4" aria-hidden />
        {copy.resendCta(count)}
      </Button>
    </div>
  );
}

export interface FinanceDispatchSentPanelProps {
  /**
   * Callback al pulsar «Reenviar N» — abre Sheet de confirmación en mode=resend.
   */
  requestResend: (selected: InvoiceListItem[]) => void;
  /** Notifica el total de enviadas para el badge del bucket. */
  onSentTotalChange?: (total: number) => void;
  /**
   * Cuando cambia (p. ej. tras batch con al menos un ok), limpia la selección.
   * La página incrementa tras `onBatchComplete` del Sheet.
   */
  selectionResetKey?: number;
}

export function FinanceDispatchSentPanel({
  requestResend,
  onSentTotalChange,
  selectionResetKey = 0,
}: FinanceDispatchSentPanelProps) {
  const { hasPermission } = usePermissions();
  const canResend = hasPermission("invoices", "execute");
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const filters = useFinanceListingFilters<"dateFrom" | "dateTo">({
    filters: {
      dateFrom: {},
      dateTo: {},
    },
    searchParamName: "search",
    chipLabels: {
      dateFrom: copy.filters.chipFrom,
      dateTo: copy.filters.chipTo,
    },
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [resendInvoiceId, setResendInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    setSelected({});
  }, [filters.search, filters.page, filters.filters.dateFrom, filters.filters.dateTo]);

  useEffect(() => {
    if (selectionResetKey === 0) return;
    setSelected({});
  }, [selectionResetKey]);

  const { data, isLoading, isError, error, refetch, isFetching } = useInvoices({
    status: "stamped",
    emailDispatch: "sent",
    search: filters.search || undefined,
    dateFrom: filters.filters.dateFrom || undefined,
    dateTo: filters.filters.dateTo || undefined,
    page: filters.page,
    limit: DISPATCH_SENT_PAGE_SIZE,
  });

  const invoices = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const sentTotal = pagination?.total ?? 0;

  useEffect(() => {
    onSentTotalChange?.(sentTotal);
  }, [onSentTotalChange, sentTotal]);

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadError,
  });

  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selected[invoice.id]),
    [invoices, selected],
  );

  const showResendBar = canResend && selectedInvoices.length > 0;

  const toggleInvoice = useCallback(
    (invoice: InvoiceListItem, checked: boolean) => {
      setSelected((prev) => ({ ...prev, [invoice.id]: checked }));
    },
    [],
  );

  const togglePage = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = { ...prev };
        for (const invoice of invoices) {
          next[invoice.id] = checked;
        }
        return next;
      });
    },
    [invoices],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handlePageChange = useCallback(
    (page: number) => {
      setSelected({});
      filters.setPage(page);
    },
    [filters],
  );

  const handleGoToPending = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(DISPATCH_TAB_PARAM);
        next.delete("search");
        next.delete("page");
        next.delete("dateFrom");
        next.delete("dateTo");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleResendClick = useCallback(() => {
    requestResend(selectedInvoices);
  }, [requestResend, selectedInvoices]);

  const handleRowResend = useCallback((invoice: InvoiceListItem) => {
    setResendInvoiceId(invoice.id);
  }, []);

  const handleRowView = useCallback(
    (invoice: InvoiceListItem) => {
      navigate(`/invoices/${invoice.id}`);
    },
    [navigate],
  );

  const handleUnitarySent = useCallback(async () => {
    setSelected({});
    await refetch();
  }, [refetch]);

  const hasSearch = Boolean(filters.search.trim());
  const hasDateFilter =
    Boolean(filters.filters.dateFrom) || Boolean(filters.filters.dateTo);
  const hasActiveFilters = hasSearch || hasDateFilter;

  return (
    <>
      <ListPageShell<InvoiceListItem>
        showHeader={false}
        title={dispatchRunsCopy.workbench.buckets.sent}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <ListingDateRangeFilter
              fromDate={filters.filters.dateFrom}
              toDate={filters.filters.dateTo}
              onApply={(nextFrom, nextTo) =>
                filters.setFilters({ dateFrom: nextFrom, dateTo: nextTo })
              }
              onClear={() =>
                filters.setFilters({ dateFrom: "", dateTo: "" })
              }
              heading={copy.filters.dateRangeHeading}
              placeholder={copy.filters.dateRangePlaceholder}
              idPrefix="dispatch-sent-date"
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          hasFilters: hasActiveFilters,
          onClearFilters: hasActiveFilters ? filters.clearAll : undefined,
          activeFilterChips: filters.activeChips,
        }}
        isLoading={isLoading}
        items={invoices}
        pagination={
          pagination
            ? {
                page: filters.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit ?? DISPATCH_SENT_PAGE_SIZE,
              }
            : undefined
        }
        onPageChange={handlePageChange}
        entityLabelPlural={copy.entityLabelPlural}
        renderTable={() => (
          <div className="space-y-4">
            <FinanceDispatchSentTable
              invoices={invoices}
              selected={selected}
              selectable={canResend}
              isLoading={isLoading}
              onToggle={toggleInvoice}
              onTogglePage={togglePage}
              onResend={handleRowResend}
              onView={handleRowView}
            />
            {showResendBar ? (
              <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
                <CardContent className="p-4">
                  <SentResendBar
                    count={selectedInvoices.length}
                    onResend={handleResendClick}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
        emptyState={{
          icon: <Mail className="h-10 w-10 text-muted-foreground" />,
          title: hasActiveFilters ? copy.empty.noResultsTitle : copy.empty.title,
          description: hasActiveFilters
            ? copy.empty.withFilters
            : copy.empty.description,
          cta: hasActiveFilters
            ? {
                label: copy.empty.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : {
                label: copy.empty.ctaPending,
                onClick: handleGoToPending,
              },
        }}
      />

      {resendInvoiceId ? (
        <SendInvoiceDialog
          invoiceId={resendInvoiceId}
          open
          onOpenChange={(open) => {
            if (!open) setResendInvoiceId(null);
          }}
          alreadySent
          onSent={handleUnitarySent}
        />
      ) : null}
    </>
  );
}
