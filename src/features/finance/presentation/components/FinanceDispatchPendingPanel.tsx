/**
 * Cola Pendientes del workbench Envío de facturas (F2).
 * Listado stamped + email_dispatch=unsent con selección multi-cliente.
 * CTA → `requestSend` abre Sheet de confirmación (F3).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { useQueryErrorToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useFinanceListingFilters } from "@features/finance/application";
import { useInvoices } from "@features/invoicing";
import type { InvoiceListItem } from "@features/invoicing/domain";
import {
  DISPATCH_PENDING_PAGE_SIZE,
  DISPATCH_TAB_PARAM,
} from "../config/dispatchWorkbenchConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchPendingTable } from "./FinanceDispatchPendingTable";

const copy = dispatchRunsCopy.workbench.pending;

function PendingSendBar({
  count,
  onSend,
}: {
  count: number;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">{copy.selectedHint}</p>
      <Button type="button" onClick={onSend}>
        <Send className="mr-2 h-4 w-4" aria-hidden />
        {copy.sendCta(count)}
      </Button>
    </div>
  );
}

export interface FinanceDispatchPendingPanelProps {
  /**
   * Callback al pulsar «Enviar N» — abre Sheet de confirmación (F3).
   */
  requestSend: (selected: InvoiceListItem[]) => void;
  /** Notifica el total de la cola para el badge del bucket Pendientes. */
  onPendingTotalChange?: (total: number) => void;
  /**
   * Cuando cambia (p. ej. tras batch con al menos un ok), limpia la selección.
   * La página incrementa tras `onBatchComplete` del Sheet.
   */
  selectionResetKey?: number;
}

export function FinanceDispatchPendingPanel({
  requestSend,
  onPendingTotalChange,
  selectionResetKey = 0,
}: FinanceDispatchPendingPanelProps) {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission("invoices", "execute");
  const [, setSearchParams] = useSearchParams();

  const filters = useFinanceListingFilters({
    filters: {},
    searchParamName: "search",
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelected({});
  }, [filters.search, filters.page]);

  useEffect(() => {
    if (selectionResetKey === 0) return;
    setSelected({});
  }, [selectionResetKey]);

  const { data, isLoading, isError, error, refetch, isFetching } = useInvoices({
    status: "stamped",
    emailDispatch: "unsent",
    search: filters.search || undefined,
    page: filters.page,
    limit: DISPATCH_PENDING_PAGE_SIZE,
  });

  const invoices = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const pendingTotal = pagination?.total ?? 0;

  useEffect(() => {
    onPendingTotalChange?.(pendingTotal);
  }, [onPendingTotalChange, pendingTotal]);

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadError,
  });

  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selected[invoice.id]),
    [invoices, selected],
  );

  const showSendBar = canSend && selectedInvoices.length > 0;

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

  const handleGoToSent = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(DISPATCH_TAB_PARAM, "sent");
        next.delete("search");
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleSendClick = useCallback(() => {
    requestSend(selectedInvoices);
  }, [requestSend, selectedInvoices]);

  const hasSearch = Boolean(filters.search.trim());

  return (
    <ListPageShell<InvoiceListItem>
      showHeader={false}
      title={dispatchRunsCopy.workbench.buckets.pending}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.searchPlaceholder,
        },
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        hasFilters: hasSearch,
        onClearFilters: hasSearch ? filters.clearAll : undefined,
      }}
      isLoading={isLoading}
      items={invoices}
      pagination={
        pagination
          ? {
              page: filters.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              limit: pagination.limit ?? DISPATCH_PENDING_PAGE_SIZE,
            }
          : undefined
      }
      onPageChange={handlePageChange}
      entityLabelPlural={copy.entityLabelPlural}
      renderTable={() => (
        <div className="space-y-4">
          <FinanceDispatchPendingTable
            invoices={invoices}
            selected={selected}
            selectable={canSend}
            isLoading={isLoading}
            onToggle={toggleInvoice}
            onTogglePage={togglePage}
          />
          {showSendBar ? (
            <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
              <CardContent className="p-4">
                <PendingSendBar
                  count={selectedInvoices.length}
                  onSend={handleSendClick}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
      emptyState={{
        icon: <Mail className="h-10 w-10 text-muted-foreground" />,
        title: hasSearch
          ? copy.empty.noResultsTitle
          : copy.empty.title,
        description: hasSearch
          ? copy.empty.withFilters
          : copy.empty.description,
        cta: hasSearch
          ? {
              label: copy.empty.clearFilters,
              onClick: filters.clearAll,
              variant: "outline",
            }
          : {
              label: copy.empty.ctaSent,
              onClick: handleGoToSent,
            },
      }}
    />
  );
}
