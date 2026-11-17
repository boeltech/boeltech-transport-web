import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowUpRight, FileClock, Send } from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { ListingResultsSummary } from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  buildRegisterCollectionPath,
  FINANCE_COBROS_BUCKET_PARAM,
  FINANCE_COBROS_PATH,
  FINANCE_COBROS_RFC_PARAM,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
  FINANCE_HUB_PATH,
  FINANCE_INVOICES_PATH,
  OPEN_PPD_INVOICES_PAGE_SIZE,
  useOpenPpdInvoices,
  useOpenPpdSummary,
} from "@features/finance/application";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FinanceCobrosTodayTray } from "../components/FinanceCobrosTodayTray";
import { FinanceCobrosInvoiceTable } from "../components/FinanceCobrosInvoiceTable";
import { FinanceRepExceptionsSection } from "../components/FinanceRepExceptionsSection";
import {
  DEFAULT_COBROS_BUCKET,
  isCobrosBucket,
  isCobrosListBucket,
  type CobrosBucketId,
} from "../config/cobrosWorkbenchConfig";
import { useHelpEmptySupport } from "@features/help-center";
import { financeCopy } from "../copy";
import {
  clearCobrosTodayTrayChannel,
  isWithInvoiceTrayEntry,
  readCobrosTodayTray,
  removeCobrosTodayEntry,
  writeCobrosTodayTray,
  type CobrosTodayEntry,
} from "../utils/cobrosFollowThrough";
import {
  isCobrosInvoiceSelectable,
  resolveCobrosSelectionAnchorRfc,
} from "../utils/cobrosSelection";
import {
  countsFromOpenPpdSummary,
  EMPTY_COBROS_BUCKET_COUNTS,
  mapCobrosWorkbenchBuckets,
} from "../utils/mapCobrosWorkbenchBuckets";

const copy = financeCopy.cobros;
const workbenchCopy = financeCopy.cobros.workbench;

// ============================================================================
// CobrosRegisterBar (selection bar)
// ============================================================================

function CobrosRegisterBar({
  count,
  clientName,
  total,
  onClear,
  onRegister,
}: {
  count: number;
  clientName: string | null;
  total: string;
  onClear: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-medium">
          {count} factura{count === 1 ? "" : "s"}
        </span>
        {clientName ? (
          <span className="text-sm text-muted-foreground">{clientName}</span>
        ) : null}
        <span className="text-sm font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">
          · {copy.selectedHint}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Quitar selección
        </Button>
        <Button type="button" size="sm" onClick={onRegister}>
          <Send className="mr-2 h-4 w-4" aria-hidden />
          Registrar cobro
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// RFC Toolbar Filter
// ============================================================================

function RfcToolbarFilter({
  onSubmit,
}: {
  onSubmit: (rfc: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    const trimmed = draft.trim().toUpperCase();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="cobros-rfc-filter" className="sr-only">
          {copy.receiverRfcLabel}
        </Label>
        <Input
          id="cobros-rfc-filter"
          className="max-w-xs font-mono"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder={workbenchCopy.rfcFilterPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) handleSubmit();
          }}
        />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit}
        disabled={!draft.trim()}
      >
        {copy.search}
      </Button>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export function FinanceCobrosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rfcFromUrl = (searchParams.get(FINANCE_COBROS_RFC_PARAM) ?? "")
    .trim()
    .toUpperCase();
  const bucketFromUrl = searchParams.get(FINANCE_COBROS_BUCKET_PARAM) ?? "";
  const activeBucket: CobrosBucketId = isCobrosBucket(bucketFromUrl)
    ? bucketFromUrl
    : DEFAULT_COBROS_BUCKET;

  const [todayTray, setTodayTray] = useState<CobrosTodayEntry[]>(() =>
    readCobrosTodayTray().filter(isWithInvoiceTrayEntry),
  );

  const handleBucketChange = useCallback(
    (bucket: CobrosBucketId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (bucket === DEFAULT_COBROS_BUCKET) {
            next.delete(FINANCE_COBROS_BUCKET_PARAM);
          } else {
            next.set(FINANCE_COBROS_BUCKET_PARAM, bucket);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleDismissTray = useCallback(() => {
    clearCobrosTodayTrayChannel("with_invoice");
    setTodayTray([]);
  }, []);

  const handleDismissEntry = useCallback((paymentId: string) => {
    const next = removeCobrosTodayEntry(readCobrosTodayTray(), paymentId);
    setTodayTray(next.filter(isWithInvoiceTrayEntry));
  }, []);

  const handleEntryLiveUpdate = useCallback(
    (paymentId: string, live: { repStatus: string }) => {
      const full = readCobrosTodayTray();
      const idx = full.findIndex((e) => e.paymentId === paymentId);
      if (idx < 0) return;
      if (full[idx].repStatus === live.repStatus) return;
      const next = [...full];
      next[idx] = { ...next[idx], repStatus: live.repStatus };
      writeCobrosTodayTray(next);
      setTodayTray(next.filter(isWithInvoiceTrayEntry));
    },
    [],
  );

  const handleRfcSearch = useCallback(
    (rfc: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(FINANCE_COBROS_RFC_PARAM, rfc);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearRfc = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(FINANCE_COBROS_RFC_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const rfcChips: ActiveFilterChip[] = useMemo(
    () =>
      rfcFromUrl
        ? [
            {
              id: "rfc",
              label: workbenchCopy.rfcChipLabel(rfcFromUrl),
              onRemove: handleClearRfc,
            },
          ]
        : [],
    [rfcFromUrl, handleClearRfc],
  );

  return (
    <FinanceCobrosWorkbench
      rfcFromUrl={rfcFromUrl}
      activeBucket={activeBucket}
      onBucketChange={handleBucketChange}
      todayTray={todayTray}
      rfcChips={rfcChips}
      onRfcSearch={handleRfcSearch}
      onClearRfc={handleClearRfc}
      onDismissTray={handleDismissTray}
      onDismissEntry={handleDismissEntry}
      onEntryLiveUpdate={handleEntryLiveUpdate}
    />
  );
}

// ============================================================================
// WORKBENCH INNER
// ============================================================================

function FinanceCobrosWorkbench({
  rfcFromUrl,
  activeBucket,
  onBucketChange,
  todayTray,
  rfcChips,
  onRfcSearch,
  onClearRfc,
  onDismissTray,
  onDismissEntry,
  onEntryLiveUpdate,
}: {
  rfcFromUrl: string;
  activeBucket: CobrosBucketId;
  onBucketChange: (bucket: CobrosBucketId) => void;
  todayTray: readonly CobrosTodayEntry[];
  rfcChips: ActiveFilterChip[];
  onRfcSearch: (rfc: string) => void;
  onClearRfc: () => void;
  onDismissTray: () => void;
  onDismissEntry: (paymentId: string) => void;
  onEntryLiveUpdate: (
    paymentId: string,
    live: { repStatus: string },
  ) => void;
}) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canRegisterPayment = hasPermission("finance", "create");
  const filterRfc = rfcFromUrl || null;
  const isListBucket = isCobrosListBucket(activeBucket);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectionBoundRfc, setSelectionBoundRfc] = useState(filterRfc);

  if (selectionBoundRfc !== filterRfc) {
    setSelectionBoundRfc(filterRfc);
    setSelected({});
    setPage(1);
  }

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useOpenPpdInvoices({
    receiverRfc: filterRfc,
    cobrosBucket: isListBucket ? activeBucket : null,
    page,
    limit: OPEN_PPD_INVOICES_PAGE_SIZE,
    enabled: isListBucket,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useOpenPpdSummary({
    receiverRfc: filterRfc,
  });

  const invoices = useMemo(() => data?.data ?? [], [data]);
  const byClient = data?.meta?.byClient;
  const pagination = data?.pagination;

  const bucketCounts = useMemo(
    () =>
      summary
        ? countsFromOpenPpdSummary(summary)
        : EMPTY_COBROS_BUCKET_COUNTS,
    [summary],
  );

  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selected[invoice.id]),
    [invoices, selected],
  );

  const selectionAnchorRfc = useMemo(
    () => resolveCobrosSelectionAnchorRfc(invoices, selected),
    [invoices, selected],
  );

  const selectedTotal = useMemo(
    () =>
      selectedInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.balanceDue.toFixed(2)),
        0,
      ),
    [selectedInvoices],
  );

  const selectedClientName = useMemo(() => {
    if (selectedInvoices.length === 0) return null;
    return selectedInvoices[0]?.receiverName?.trim() || selectionAnchorRfc;
  }, [selectedInvoices, selectionAnchorRfc]);

  const formattedSelectedTotal = formatMxCurrency(selectedTotal);
  const paymentReceiverRfc = selectionAnchorRfc;

  const openRegisterForm = useCallback(() => {
    if (!paymentReceiverRfc || selectedInvoices.length === 0) return;
    navigate(
      buildRegisterCollectionPath({
        channel: "with_invoice",
        receiverRfc: paymentReceiverRfc,
        invoiceIds: selectedInvoices.map((inv) => inv.id),
        from: `${FINANCE_COBROS_PATH}${filterRfc ? `?${FINANCE_COBROS_RFC_PARAM}=${encodeURIComponent(filterRfc)}` : ""}`,
      }),
    );
  }, [
    filterRfc,
    navigate,
    paymentReceiverRfc,
    selectedInvoices,
  ]);

  const showRegisterBar =
    canRegisterPayment &&
    selectedInvoices.length > 0 &&
    Boolean(paymentReceiverRfc) &&
    invoices.length > 0;

  const toggleInvoice = (invoice: FinanceInvoiceListItem, checked: boolean) => {
    if (checked && !isCobrosInvoiceSelectable(invoice, selectionAnchorRfc)) {
      return;
    }
    setSelected((prev) => ({ ...prev, [invoice.id]: checked }));
  };

  const toggleGroup = useCallback(
    (groupKey: string, checked: boolean) => {
      setSelected((prev) => {
        const next = { ...prev };
        for (const invoice of invoices) {
          const rfc = invoice.receiverRfc.trim().toUpperCase();
          if (rfc === groupKey) {
            next[invoice.id] = checked;
          }
        }
        return next;
      });
    },
    [invoices],
  );

  const togglePage = (checked: boolean) => {
    const firstRfc = invoices[0]?.receiverRfc?.trim().toUpperCase() ?? null;
    setSelected((prev) => {
      const next = { ...prev };
      for (const invoice of invoices) {
        if (isCobrosInvoiceSelectable(invoice, selectionAnchorRfc ?? firstRfc)) {
          next[invoice.id] = checked;
        }
      }
      return next;
    });
  };

  const handleRegisterGroup = useCallback(
    (rfc: string, clientId: string | null) => {
      navigate(
        buildRegisterCollectionPath({
          channel: "with_invoice",
          receiverRfc: rfc,
          clientId,
          from: `${FINANCE_COBROS_PATH}${filterRfc ? `?${FINANCE_COBROS_RFC_PARAM}=${encodeURIComponent(filterRfc)}` : ""}`,
        }),
      );
    },
    [filterRfc, navigate],
  );

  const handleClearSelection = useCallback(() => {
    setSelected({});
  }, []);

  const handlePageChange = (nextPage: number) => {
    setSelected({});
    setPage(nextPage);
  };

  const handleBucketChange = useCallback(
    (bucket: CobrosBucketId) => {
      setSelected({});
      setPage(1);
      onBucketChange(bucket);
    },
    [onBucketChange],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchSummary()]);
  }, [refetch, refetchSummary]);

  const buckets = useMemo(
    () =>
      mapCobrosWorkbenchBuckets({
        counts: bucketCounts,
        activeBucket,
        onBucketChange: handleBucketChange,
        totalBalance: summary?.totalBalance,
      }),
    [bucketCounts, activeBucket, handleBucketChange, summary?.totalBalance],
  );

  const isDegraded = isListBucket && isError && !isLoading;
  const emptyBucket = workbenchCopy.emptyByBucket[activeBucket];
  const hasRfcFilter = Boolean(filterRfc);
  const listLoading = isListBucket && (isLoading || summaryLoading);
  const helpEmpty = useHelpEmptySupport(
    FINANCE_COBROS_PATH,
    activeBucket === "open" && !hasRfcFilter,
  );

  return (
    <>
      <WorkbenchPageShell
        title={workbenchCopy.title}
        description={workbenchCopy.description}
        beforeAwareness={
          todayTray.length > 0 ? (
            <FinanceCobrosTodayTray
              entries={todayTray}
              onDismissTray={onDismissTray}
              onDismissEntry={onDismissEntry}
              onViewExceptions={() => handleBucketChange("rep_exceptions")}
              onEntryLiveUpdate={onEntryLiveUpdate}
            />
          ) : undefined
        }
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
        bucketsLoading={summaryLoading}
        isDegraded={isDegraded}
        degradedMessage={workbenchCopy.degradedMessage}
        degradedHref={FINANCE_INVOICES_PATH}
        degradedLinkLabel={workbenchCopy.degradedLinkLabel}
        afterAwareness={
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {workbenchCopy.crossLink}{" "}
            <Link
              to={FINANCE_EFECTIVO_POR_COBRAR_PATH}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {workbenchCopy.crossLinkLabel}
              <ArrowUpRight
                className="ml-0.5 inline h-3.5 w-3.5"
                aria-hidden
              />
            </Link>
          </div>
        }
        toolbar={{
          filters: (
            <RfcToolbarFilter onSubmit={onRfcSearch} />
          ),
          activeFilterChips: rfcChips,
          onClearFilters: rfcFromUrl ? onClearRfc : undefined,
          hasFilters: Boolean(rfcFromUrl),
          onRefresh: handleRefresh,
          isRefreshing: isFetching || summaryLoading,
        }}
        renderContent={() => {
          if (activeBucket === "rep_exceptions") {
            return (
              <FinanceRepExceptionsSection
                key={`exceptions-${rfcFromUrl || "all"}`}
                receiverRfc={filterRfc}
              />
            );
          }

          if (listLoading) {
            return (
              <FinanceCobrosInvoiceTable
                invoices={[]}
                selected={{}}
                isLoading
                onToggle={() => undefined}
                onToggleGroup={() => undefined}
                onTogglePage={() => undefined}
              />
            );
          }

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

          if (invoices.length === 0) {
            const emptyCopy = hasRfcFilter
              ? workbenchCopy.emptyWithFilters
              : emptyBucket;
            return (
              <EmptyState
                icon={
                  <FileClock className="h-10 w-10 text-muted-foreground" />
                }
                title={emptyCopy.title}
                description={
                  !hasRfcFilter && helpEmpty
                    ? helpEmpty.phrase
                    : emptyCopy.description
                }
                secondaryCta={
                  hasRfcFilter
                    ? {
                        label: workbenchCopy.emptyWithFilters.clearFilters,
                        onClick: onClearRfc,
                        variant: "outline" as const,
                      }
                    : helpEmpty
                      ? helpEmpty.viewHelpCta
                      : undefined
                }
              />
            );
          }

          return (
            <div className="space-y-4">
              {pagination && pagination.total > 0 ? (
                <ListingResultsSummary
                  entityLabelPlural={copy.entityLabelPlural}
                  total={pagination.total}
                  page={pagination.page}
                  limit={pagination.limit}
                />
              ) : null}
              <FinanceCobrosInvoiceTable
                invoices={invoices}
                byClient={byClient ? [...byClient] : undefined}
                selected={selected}
                anchorRfc={selectionAnchorRfc}
                isLoading={false}
                onToggle={toggleInvoice}
                onToggleGroup={toggleGroup}
                onTogglePage={togglePage}
                onRegisterGroup={
                  canRegisterPayment ? handleRegisterGroup : undefined
                }
              />
              {showRegisterBar ? (
                <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
                  <CardContent className="p-4">
                    <CobrosRegisterBar
                      count={selectedInvoices.length}
                      clientName={selectedClientName}
                      total={formattedSelectedTotal}
                      onClear={handleClearSelection}
                      onRegister={openRegisterForm}
                    />
                  </CardContent>
                </Card>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {copy.footerNote}
              </p>
            </div>
          );
        }}
        pagination={
          isListBucket && pagination
            ? {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit,
              }
            : undefined
        }
        onPageChange={isListBucket ? handlePageChange : undefined}
        relatedConfig={{
          label: workbenchCopy.relatedConfig.label,
          href: FINANCE_HUB_PATH,
          description: workbenchCopy.relatedConfig.description,
        }}
      />
    </>
  );
}
