import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTodayMexicoDateString } from "@boeltech/cfdi-domain";
import { FileClock, Send } from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { ListingResultsSummary } from "@shared/ui/listing";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  FINANCE_COBROS_RFC_PARAM,
  OPEN_PPD_INVOICES_PAGE_SIZE,
  useOpenPpdInvoices,
  useOpenPpdSummary,
  useRegisterFinancePayment,
} from "@features/finance/application";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";
import { FinanceChainRepairConfirmDialog } from "../components/FinanceChainRepairConfirmDialog";
import { FinanceCobrosConfirmSheet } from "../components/FinanceCobrosConfirmSheet";
import { FinanceCobrosTodayTray } from "../components/FinanceCobrosTodayTray";
import { FinanceCobrosInvoiceTable } from "../components/FinanceCobrosInvoiceTable";
import { FinanceRepExceptionsSection } from "../components/FinanceRepExceptionsSection";
import {
  COBROS_PAYMENT_FORM,
  COBROS_PAYMENT_TIME_DEFAULT,
  normalizeCobrosPaymentTime,
} from "../config/financeCobrosConfig";
import {
  DEFAULT_COBROS_BUCKET,
  isCobrosListBucket,
  type CobrosBucketId,
} from "../config/cobrosWorkbenchConfig";
import { useHelpEmptySupport } from "@features/help-center";
import { financeCopy } from "../copy";
import { getChainRepairAffectedLabels } from "../utils/chainRepairPlanLabels";
import {
  appendCobrosTodayEntry,
  buildCobrosFollowThrough,
  clearCobrosTodayTray,
  readCobrosTodayTray,
  removeCobrosTodayEntry,
  writeCobrosTodayTray,
  type CobrosTodayEntry,
} from "../utils/cobrosFollowThrough";
import {
  cobrosInvoicesForPageToggle,
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
const COBROS_PATH = "/finance/cobros";

// ============================================================================
// CobrosRegisterBar
// ============================================================================

function CobrosRegisterBar({
  count,
  total,
  onRegister,
}: {
  count: number;
  total: string;
  onRegister: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">{copy.selectedHint}</p>
      <Button type="button" onClick={onRegister}>
        <Send className="mr-2 h-4 w-4" aria-hidden />
        {copy.registerCta(count, total)}
      </Button>
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

  const [activeBucket, setActiveBucket] = useState<CobrosBucketId>(DEFAULT_COBROS_BUCKET);
  const [todayTray, setTodayTray] = useState<CobrosTodayEntry[]>(() =>
    readCobrosTodayTray(),
  );

  const handlePaymentRegistered = useCallback((next: CobrosTodayEntry) => {
    setTodayTray((prev) => appendCobrosTodayEntry(prev, next));
  }, []);

  const handleDismissTray = useCallback(() => {
    clearCobrosTodayTray();
    setTodayTray([]);
  }, []);

  const handleDismissEntry = useCallback((paymentId: string) => {
    setTodayTray((prev) => removeCobrosTodayEntry(prev, paymentId));
  }, []);

  const handleEntryLiveUpdate = useCallback(
    (paymentId: string, live: { repStatus: string }) => {
      setTodayTray((prev) => {
        const idx = prev.findIndex((e) => e.paymentId === paymentId);
        if (idx < 0) return prev;
        if (prev[idx].repStatus === live.repStatus) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], repStatus: live.repStatus };
        writeCobrosTodayTray(next);
        return next;
      });
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
      onBucketChange={setActiveBucket}
      todayTray={todayTray}
      rfcChips={rfcChips}
      onRfcSearch={handleRfcSearch}
      onClearRfc={handleClearRfc}
      onPaymentRegistered={handlePaymentRegistered}
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
  onPaymentRegistered,
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
  onPaymentRegistered: (entry: CobrosTodayEntry) => void;
  onDismissTray: () => void;
  onDismissEntry: (paymentId: string) => void;
  onEntryLiveUpdate: (
    paymentId: string,
    live: { repStatus: string },
  ) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canRegisterPayment = hasPermission("finance", "create");
  const filterRfc = rfcFromUrl || null;
  const isListBucket = isCobrosListBucket(activeBucket);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectionBoundRfc, setSelectionBoundRfc] = useState(filterRfc);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(getTodayMexicoDateString);
  const [paymentTime, setPaymentTime] = useState(COBROS_PAYMENT_TIME_DEFAULT);
  const [reference, setReference] = useState("");
  const [chainRepairOpen, setChainRepairOpen] = useState(false);
  const [chainRepairLabels, setChainRepairLabels] = useState<string[]>([]);
  const [chainRepairError, setChainRepairError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] =
    useState<RegisterFinancePaymentPayload | null>(null);
  const loteSnapshotRef = useRef<FinanceInvoiceListItem[]>([]);

  // Reset selection/page when RFC filter changes (render-time adjust, not effect).
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

  const formattedSelectedTotal = formatMxCurrency(selectedTotal);
  const paymentReceiverRfc = selectionAnchorRfc;

  const resetPaymentFields = useCallback(() => {
    setPaymentDate(getTodayMexicoDateString());
    setPaymentTime(COBROS_PAYMENT_TIME_DEFAULT);
    setReference("");
  }, []);

  const openConfirmSheet = useCallback(() => {
    resetPaymentFields();
    setSheetOpen(true);
  }, [resetPaymentFields]);

  const showRegisterBar =
    canRegisterPayment &&
    selectedInvoices.length > 0 &&
    Boolean(paymentReceiverRfc) &&
    invoices.length > 0;

  const { mutate, isPending } = useRegisterFinancePayment({
    onSuccess: (data: FinancePayment, variables) => {
      const snapshot = loteSnapshotRef.current;
      if (snapshot.length > 0) {
        onPaymentRegistered(buildCobrosFollowThrough(data, variables, snapshot));
      }
      toast({
        title: copy.toastSuccessTitle,
        description: copy.toastSuccessDescription(
          formatMxCurrency(variables.amount),
        ),
      });
      setSheetOpen(false);
      setChainRepairOpen(false);
      setChainRepairError(null);
      setPendingPayload(null);
      setSelected({});
      resetPaymentFields();
    },
  });

  const handleMutationError = (err: Error, fromChainDialog: boolean) => {
    if (err instanceof ApiError && err.code === "CHAIN_REORDER_REQUIRED") {
      setChainRepairLabels(getChainRepairAffectedLabels(err.details));
      setChainRepairError(null);
      setSheetOpen(false);
      setChainRepairOpen(true);
      return;
    }
    const message =
      err instanceof ApiError && err.code === "REP_CURRENCY_NOT_SUPPORTED"
        ? "Solo se admiten cobros y complementos de pago (REP) en MXN."
        : getErrorMessage(err);
    if (fromChainDialog) {
      setChainRepairError(message);
      return;
    }
    toast({
      variant: "error",
      title: copy.toastError,
      description: message,
    });
  };

  const toggleInvoice = (invoice: FinanceInvoiceListItem, checked: boolean) => {
    if (checked && !isCobrosInvoiceSelectable(invoice, selectionAnchorRfc)) {
      return;
    }
    setSelected((prev) => ({ ...prev, [invoice.id]: checked }));
  };

  const togglePage = (checked: boolean) => {
    const targets = cobrosInvoicesForPageToggle(invoices, selectionAnchorRfc);
    setSelected((prev) => {
      const next = { ...prev };
      for (const invoice of targets) {
        next[invoice.id] = checked;
      }
      return next;
    });
  };

  const buildPayload = (
    confirmChainRepair?: boolean,
  ): RegisterFinancePaymentPayload | null => {
    if (!paymentReceiverRfc || selectedInvoices.length === 0) return null;
    const allocations = selectedInvoices.map((invoice) => ({
      ingressInvoiceId: invoice.id,
      amount: Number(invoice.balanceDue.toFixed(2)),
    }));
    const amount = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    return {
      receiverRfc: paymentReceiverRfc,
      amount,
      currency: "MXN",
      exchangeRate: 1,
      paymentDate,
      paymentTime: normalizeCobrosPaymentTime(paymentTime),
      paymentForm: COBROS_PAYMENT_FORM,
      reference: reference.trim() || undefined,
      allocations,
      confirmChainRepair,
    };
  };

  const submitPayload = (
    payload: RegisterFinancePaymentPayload,
    fromChainDialog = false,
  ) => {
    loteSnapshotRef.current = selectedInvoices;
    setPendingPayload(payload);
    mutate(payload, {
      onError: (err) => handleMutationError(err, fromChainDialog),
    });
  };

  const handleRegister = () => {
    const payload = buildPayload();
    if (!payload) return;
    submitPayload(payload);
  };

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
    COBROS_PATH,
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
              onEntryLiveUpdate={onEntryLiveUpdate}
            />
          ) : undefined
        }
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
        bucketsLoading={summaryLoading}
        isDegraded={isDegraded}
        degradedMessage={workbenchCopy.degradedMessage}
        degradedHref="/finance/invoices"
        degradedLinkLabel={workbenchCopy.degradedLinkLabel}
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
                onTogglePage={() => undefined}
              />
            );
          }

          if (isError) {
            return (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-destructive">{copy.loadError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                  >
                    {copy.retry}
                  </Button>
                </CardContent>
              </Card>
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
                selected={selected}
                anchorRfc={selectionAnchorRfc}
                isLoading={false}
                onToggle={toggleInvoice}
                onTogglePage={togglePage}
              />
              {showRegisterBar ? (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <CobrosRegisterBar
                      count={selectedInvoices.length}
                      total={formattedSelectedTotal}
                      onRegister={openConfirmSheet}
                    />
                  </CardContent>
                </Card>
              ) : null}
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
          href: "/finance",
          description: workbenchCopy.relatedConfig.description,
        }}
      />

      {canRegisterPayment ? (
        <FinanceCobrosConfirmSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          invoices={selectedInvoices}
          total={selectedTotal}
          receiverRfc={paymentReceiverRfc ?? ""}
          paymentDate={paymentDate}
          onPaymentDateChange={setPaymentDate}
          paymentTime={paymentTime}
          onPaymentTimeChange={setPaymentTime}
          reference={reference}
          onReferenceChange={setReference}
          isPending={isPending || chainRepairOpen}
          onConfirm={handleRegister}
        />
      ) : null}

      {canRegisterPayment ? (
        <FinanceChainRepairConfirmDialog
          open={chainRepairOpen}
          onOpenChange={(open) => {
            setChainRepairOpen(open);
            if (!open) setChainRepairError(null);
          }}
          isPending={isPending}
          affectedLabels={chainRepairLabels}
          errorMessage={chainRepairError}
          onConfirm={() => {
            setChainRepairError(null);
            if (!pendingPayload) {
              const payload = buildPayload(true);
              if (payload) submitPayload(payload, true);
              return;
            }
            mutate(
              { ...pendingPayload, confirmChainRepair: true },
              {
                onError: (err) => handleMutationError(err, true),
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
