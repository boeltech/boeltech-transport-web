/**
 * Cola Enviadas del workbench Envíos (tipado factura + REP).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Mail, Send } from "lucide-react";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { ListingDateRangeFilter } from "@shared/ui/listing";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useFinanceListingFilters } from "@features/finance/application";
import { SendInvoiceDialog, SendRepDialog } from "@features/invoicing";
import { useDispatchDocuments } from "@features/invoicing/application";
import type {
  DispatchDocumentItem,
  DispatchDocumentKindFilter,
} from "@features/invoicing/domain";
import {
  DISPATCH_DOCUMENT_KIND_PARAM,
  DISPATCH_SENT_PAGE_SIZE,
  DISPATCH_TAB_PARAM,
  parseDispatchDocumentKindFilter,
} from "../config/dispatchWorkbenchConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { dispatchDocumentSelectionKey } from "../utils/groupDispatchDocumentsForSend";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";
import { FinanceDispatchDocumentKindFilter } from "./FinanceDispatchDocumentKindFilter";
import { FinanceDispatchSentTable } from "./FinanceDispatchSentTable";

const copy = dispatchRunsCopy.workbench.sent;
const typeCopy = dispatchRunsCopy.workbench.typeFilter;

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
  requestResend: (selected: DispatchDocumentItem[]) => void;
  onSentTotalChange?: (total: number) => void;
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
  const fromState = useInvoiceQueueFromState();
  const [searchParams, setSearchParams] = useSearchParams();

  const documentKind = parseDispatchDocumentKindFilter(
    searchParams.get(DISPATCH_DOCUMENT_KIND_PARAM),
  );

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
  const [resendPaymentId, setResendPaymentId] = useState<string | null>(null);

  useEffect(() => {
    setSelected({});
  }, [
    filters.search,
    filters.page,
    filters.filters.dateFrom,
    filters.filters.dateTo,
    documentKind,
  ]);

  useEffect(() => {
    if (selectionResetKey === 0) return;
    setSelected({});
  }, [selectionResetKey]);

  const { data, isLoading, isError, refetch, isFetching } = useDispatchDocuments(
    {
      bucket: "sent",
      documentKind,
      search: filters.search || undefined,
      dateFrom: filters.filters.dateFrom || undefined,
      dateTo: filters.filters.dateTo || undefined,
      page: filters.page,
      limit: DISPATCH_SENT_PAGE_SIZE,
    },
  );

  const documents = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const sentTotal = pagination?.total ?? 0;

  useEffect(() => {
    onSentTotalChange?.(sentTotal);
  }, [onSentTotalChange, sentTotal]);

  const selectedDocuments = useMemo(
    () =>
      documents.filter((doc) => selected[dispatchDocumentSelectionKey(doc)]),
    [documents, selected],
  );

  const showResendBar = canResend && selectedDocuments.length > 0;

  const handleDocumentKindChange = useCallback(
    (next: DispatchDocumentKindFilter) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "all") {
            params.delete(DISPATCH_DOCUMENT_KIND_PARAM);
          } else {
            params.set(DISPATCH_DOCUMENT_KIND_PARAM, next);
          }
          params.delete("page");
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleDocument = useCallback(
    (doc: DispatchDocumentItem, checked: boolean) => {
      setSelected((prev) => ({
        ...prev,
        [dispatchDocumentSelectionKey(doc)]: checked,
      }));
    },
    [],
  );

  const togglePage = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = { ...prev };
        for (const doc of documents) {
          next[dispatchDocumentSelectionKey(doc)] = checked;
        }
        return next;
      });
    },
    [documents],
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
    requestResend(selectedDocuments);
  }, [requestResend, selectedDocuments]);

  const handleRowResend = useCallback((doc: DispatchDocumentItem) => {
    if (doc.documentKind === "invoice") {
      setResendInvoiceId(doc.id);
      return;
    }
    setResendPaymentId(doc.id);
  }, []);

  const handleRowView = useCallback(
    (doc: DispatchDocumentItem) => {
      if (doc.documentKind !== "invoice") return;
      navigate(`/invoices/${doc.id}`, { state: fromState });
    },
    [fromState, navigate],
  );

  const handleUnitarySent = useCallback(async () => {
    setSelected({});
    await refetch();
  }, [refetch]);

  const hasSearch = Boolean(filters.search.trim());
  const hasDateFilter =
    Boolean(filters.filters.dateFrom) || Boolean(filters.filters.dateTo);
  const hasTypeFilter = documentKind !== "all";
  const hasActiveFilters = hasSearch || hasDateFilter || hasTypeFilter;

  const typeChipLabel =
    documentKind === "invoice"
      ? typeCopy.invoice
      : documentKind === "rep"
        ? typeCopy.rep
        : typeCopy.all;

  const activeChips = [
    ...filters.activeChips,
    ...(hasTypeFilter
      ? [
          {
            id: "document_kind",
            label: typeCopy.chip(typeChipLabel),
            onRemove: () => handleDocumentKindChange("all"),
          },
        ]
      : []),
  ];

  if (isError) {
    return (
      <DetailAlertCard
        severity="critical"
        icon={<AlertCircle className="h-5 w-5" aria-hidden />}
        title={copy.loadErrorTitle}
        items={[{ text: copy.loadError }]}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
          >
            {copy.retry}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ListPageShell<DispatchDocumentItem>
        showHeader={false}
        title={dispatchRunsCopy.workbench.buckets.sent}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FinanceDispatchDocumentKindFilter
                value={documentKind}
                onChange={handleDocumentKindChange}
              />
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
            </div>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          hasFilters: hasActiveFilters,
          onClearFilters: hasActiveFilters
            ? () => {
                filters.clearAll();
                if (hasTypeFilter) handleDocumentKindChange("all");
              }
            : undefined,
          activeFilterChips: activeChips,
        }}
        isLoading={isLoading}
        items={documents}
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
              documents={documents}
              selected={selected}
              selectable={canResend}
              isLoading={isLoading}
              onToggle={toggleDocument}
              onTogglePage={togglePage}
              onResend={canResend ? handleRowResend : undefined}
              onView={handleRowView}
            />
            {showResendBar ? (
              <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
                <CardContent className="p-4">
                  <SentResendBar
                    count={selectedDocuments.length}
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
                onClick: () => {
                  filters.clearAll();
                  if (hasTypeFilter) handleDocumentKindChange("all");
                },
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
      {resendPaymentId ? (
        <SendRepDialog
          paymentId={resendPaymentId}
          open
          onOpenChange={(open) => {
            if (!open) setResendPaymentId(null);
          }}
          alreadySent
          onSent={handleUnitarySent}
        />
      ) : null}
    </>
  );
}
