/**
 * Cola Pendientes del workbench Envíos (tipado factura + REP).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Mail, Send } from "lucide-react";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useFinanceListingFilters } from "@features/finance/application";
import { useDispatchDocuments } from "@features/invoicing/application";
import type {
  DispatchDocumentItem,
  DispatchDocumentKindFilter,
} from "@features/invoicing/domain";
import {
  DISPATCH_DOCUMENT_KIND_PARAM,
  DISPATCH_PENDING_PAGE_SIZE,
  DISPATCH_TAB_PARAM,
  parseDispatchDocumentKindFilter,
} from "../config/dispatchWorkbenchConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { dispatchDocumentSelectionKey } from "../utils/groupDispatchDocumentsForSend";
import { FinanceDispatchListFilters } from "./FinanceDispatchListFilters";
import { FinanceDispatchPendingTable } from "./FinanceDispatchPendingTable";

const copy = dispatchRunsCopy.workbench.pending;
const typeCopy = dispatchRunsCopy.workbench.typeFilter;

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
  requestSend: (selected: DispatchDocumentItem[]) => void;
  onPendingTotalChange?: (total: number) => void;
  selectionResetKey?: number;
}

export function FinanceDispatchPendingPanel({
  requestSend,
  onPendingTotalChange,
  selectionResetKey = 0,
}: FinanceDispatchPendingPanelProps) {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission("invoices", "execute");
  const [searchParams, setSearchParams] = useSearchParams();

  const documentKind = parseDispatchDocumentKindFilter(
    searchParams.get(DISPATCH_DOCUMENT_KIND_PARAM),
  );

  const filters = useFinanceListingFilters({
    filters: {},
    searchParamName: "search",
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelected({});
  }, [filters.search, filters.page, documentKind]);

  useEffect(() => {
    if (selectionResetKey === 0) return;
    setSelected({});
  }, [selectionResetKey]);

  const { data, isLoading, isError, refetch, isFetching } = useDispatchDocuments(
    {
      bucket: "pending",
      documentKind,
      search: filters.search || undefined,
      page: filters.page,
      limit: DISPATCH_PENDING_PAGE_SIZE,
    },
  );

  const documents = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const pendingTotal = pagination?.total ?? 0;

  useEffect(() => {
    onPendingTotalChange?.(pendingTotal);
  }, [onPendingTotalChange, pendingTotal]);

  const selectedDocuments = useMemo(
    () =>
      documents.filter((doc) => selected[dispatchDocumentSelectionKey(doc)]),
    [documents, selected],
  );

  const showSendBar = canSend && selectedDocuments.length > 0;

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
    requestSend(selectedDocuments);
  }, [requestSend, selectedDocuments]);

  const hasSearch = Boolean(filters.search.trim());
  const hasTypeFilter = documentKind !== "all";
  const hasActiveFilters = hasSearch || hasTypeFilter;
  const activePanelFilterCount = hasTypeFilter ? 1 : 0;

  const typeChipLabel =
    documentKind === "invoice"
      ? typeCopy.invoice
      : documentKind === "rep"
        ? typeCopy.rep
        : typeCopy.all;

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
    <ListPageShell<DispatchDocumentItem>
      showHeader={false}
      title={dispatchRunsCopy.workbench.buckets.pending}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.searchPlaceholder,
        },
        filters: (
          <FinanceDispatchListFilters
            key={
              activePanelFilterCount > 0 ? "filters-active" : "filters-idle"
            }
            documentKind={documentKind}
            activePanelFilterCount={activePanelFilterCount}
            onDocumentKindChange={handleDocumentKindChange}
          />
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
        activeFilterChips: hasTypeFilter
          ? [
              {
                id: "document_kind",
                label: typeCopy.chip(typeChipLabel),
                onRemove: () => handleDocumentKindChange("all"),
              },
            ]
          : undefined,
      }}
      isLoading={isLoading}
      items={documents}
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
            documents={documents}
            selected={selected}
            selectable={canSend}
            isLoading={isLoading}
            onToggle={toggleDocument}
            onTogglePage={togglePage}
          />
          {showSendBar ? (
            <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
              <CardContent className="p-4">
                <PendingSendBar
                  count={selectedDocuments.length}
                  onSend={handleSendClick}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
      emptyState={{
        icon: <Mail className="h-10 w-10 text-muted-foreground" />,
        title: hasActiveFilters
          ? copy.empty.noResultsTitle
          : copy.empty.title,
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
              label: copy.empty.ctaSent,
              onClick: handleGoToSent,
            },
      }}
    />
  );
}
