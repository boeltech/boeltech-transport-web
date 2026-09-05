import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams, type SetURLSearchParams } from "react-router-dom";
import { getTodayMexicoDateString } from "@boeltech/cfdi-domain";
import { Send, Wallet } from "lucide-react";
import {
  WorkbenchPageShell,
  type ActiveFilterChip,
} from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
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
  useRegisterFinancePayment,
  useRepExceptions,
} from "@features/finance/application";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";
import { FinanceChainRepairConfirmDialog } from "../components/FinanceChainRepairConfirmDialog";
import { FinanceCobrosConfirmSheet } from "../components/FinanceCobrosConfirmSheet";
import { FinanceCobrosFollowThroughAlert } from "../components/FinanceCobrosFollowThroughAlert";
import { FinanceCobrosInvoiceTable } from "../components/FinanceCobrosInvoiceTable";
import { FinanceRepExceptionsSection } from "../components/FinanceRepExceptionsSection";
import {
  COBROS_PAYMENT_FORM,
  COBROS_PAYMENT_TIME,
} from "../config/financeCobrosConfig";
import {
  DEFAULT_COBROS_BUCKET,
  type CobrosBucketId,
} from "../config/cobrosWorkbenchConfig";
import { financeCopy } from "../copy";
import { getChainRepairAffectedLabels } from "../utils/chainRepairPlanLabels";
import {
  buildCobrosFollowThrough,
  readCobrosFollowThrough,
  writeCobrosFollowThrough,
  type CobrosFollowThrough,
} from "../utils/cobrosFollowThrough";
import {
  countInvoicesByCobrosBucket,
  mapCobrosWorkbenchBuckets,
} from "../utils/mapCobrosWorkbenchBuckets";

const copy = financeCopy.cobros;
const workbenchCopy = financeCopy.cobros.workbench;

// ============================================================================
// CobrosRegisterBar (unchanged)
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
  const [followThrough, setFollowThrough] = useState<CobrosFollowThrough | null>(
    () => readCobrosFollowThrough(),
  );

  const handlePaymentRegistered = (next: CobrosFollowThrough) => {
    writeCobrosFollowThrough(next);
    setFollowThrough(next);
  };

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
      followThrough={followThrough}
      rfcChips={rfcChips}
      onRfcSearch={handleRfcSearch}
      onClearRfc={handleClearRfc}
      setSearchParams={setSearchParams}
      onPaymentRegistered={handlePaymentRegistered}
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
  followThrough,
  rfcChips,
  onRfcSearch,
  onClearRfc,
  setSearchParams,
  onPaymentRegistered,
}: {
  rfcFromUrl: string;
  activeBucket: CobrosBucketId;
  onBucketChange: (bucket: CobrosBucketId) => void;
  followThrough: CobrosFollowThrough | null;
  rfcChips: ActiveFilterChip[];
  onRfcSearch: (rfc: string) => void;
  onClearRfc: () => void;
  setSearchParams: SetURLSearchParams;
  onPaymentRegistered: (followThrough: CobrosFollowThrough) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canRegisterPayment = hasPermission("finance", "create");
  const searchRfc = rfcFromUrl || null;

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [chainRepairOpen, setChainRepairOpen] = useState(false);
  const [chainRepairLabels, setChainRepairLabels] = useState<string[]>([]);
  const [chainRepairError, setChainRepairError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] =
    useState<RegisterFinancePaymentPayload | null>(null);
  const loteSnapshotRef = useRef<FinanceInvoiceListItem[]>([]);

  const { data, isLoading, isError, refetch } = useOpenPpdInvoices(searchRfc, {
    page,
    limit: OPEN_PPD_INVOICES_PAGE_SIZE,
  });
  const invoices = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  // REP exceptions count for bucket badge
  const { data: repData } = useRepExceptions({
    page: 1,
    limit: 1,
    receiverRfc: searchRfc,
  });
  const repExceptionsCount = repData?.pagination?.total ?? 0;

  // Client-side bucket counts (degraded mode)
  const bucketCounts = useMemo(
    () => countInvoicesByCobrosBucket(invoices, repExceptionsCount),
    [invoices, repExceptionsCount],
  );

  const pageBalance = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balanceDue.toFixed(2)),
        0,
      ),
    [invoices],
  );

  // Filter invoices client-side by active bucket
  const filteredInvoices = useMemo(() => {
    if (activeBucket === "all") return invoices;
    if (activeBucket === "partial") {
      return invoices.filter((i) => i.totalPaid > 0 && i.balanceDue > 0);
    }
    // overdue: no due_date available yet — show all (TODO: backend)
    if (activeBucket === "overdue") return [];
    // rep_exceptions: handled separately in renderContent
    return invoices;
  }, [invoices, activeBucket]);

  const selectedInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => selected[invoice.id]),
    [filteredInvoices, selected],
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
  const paymentDate = getTodayMexicoDateString();
  const showRegisterBar =
    canRegisterPayment && selectedInvoices.length > 0 && filteredInvoices.length > 0;

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
      setReference("");
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
    const message = getErrorMessage(err);
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
    setSelected((prev) => ({ ...prev, [invoice.id]: checked }));
  };

  const togglePage = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const invoice of filteredInvoices) {
        next[invoice.id] = checked;
      }
      return next;
    });
  };

  const buildPayload = (
    confirmChainRepair?: boolean,
  ): RegisterFinancePaymentPayload | null => {
    if (!searchRfc || selectedInvoices.length === 0) return null;
    const allocations = selectedInvoices.map((invoice) => ({
      ingressInvoiceId: invoice.id,
      amount: Number(invoice.balanceDue.toFixed(2)),
    }));
    const amount = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    return {
      receiverRfc: searchRfc,
      amount,
      currency: "MXN",
      exchangeRate: 1,
      paymentDate,
      paymentTime: COBROS_PAYMENT_TIME,
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

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Buckets
  const buckets = useMemo(
    () =>
      mapCobrosWorkbenchBuckets({
        counts: bucketCounts,
        activeBucket,
        onBucketChange: (bucket) => {
          setSelected({});
          setPage(1);
          onBucketChange(bucket);
        },
        totalBalance: pageBalance,
      }),
    [bucketCounts, activeBucket, onBucketChange, pageBalance],
  );

  // renderContent: bucket rep_exceptions → exceptions section; rest → invoice table
  const renderContent = useCallback(() => {
    if (activeBucket === "rep_exceptions") {
      return (
        <FinanceRepExceptionsSection
          key={`exceptions-${rfcFromUrl || "all"}`}
          receiverRfc={searchRfc}
        />
      );
    }

    const showInvoiceContent =
      searchRfc && (isLoading || filteredInvoices.length > 0) && !isError;

    if (!searchRfc) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {copy.taskDescription}
          </CardContent>
        </Card>
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

    if (!isLoading && filteredInvoices.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {copy.emptyTitle}
          </CardContent>
        </Card>
      );
    }

    if (!showInvoiceContent) return null;

    return (
      <div className="space-y-4">
        {showRegisterBar ? (
          <CobrosRegisterBar
            count={selectedInvoices.length}
            total={formattedSelectedTotal}
            onRegister={() => setSheetOpen(true)}
          />
        ) : null}
        {pagination && pagination.total > 0 ? (
          <ListingResultsSummary
            entityLabelPlural={copy.entityLabelPlural}
            total={pagination.total}
            page={pagination.page}
            limit={pagination.limit}
          />
        ) : null}
        <FinanceCobrosInvoiceTable
          invoices={filteredInvoices}
          selected={selected}
          isLoading={isLoading && filteredInvoices.length === 0}
          onToggle={toggleInvoice}
          onTogglePage={togglePage}
        />
        {showRegisterBar ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <CobrosRegisterBar
                count={selectedInvoices.length}
                total={formattedSelectedTotal}
                onRegister={() => setSheetOpen(true)}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }, [
    activeBucket,
    rfcFromUrl,
    searchRfc,
    isLoading,
    isError,
    filteredInvoices,
    selected,
    selectedInvoices,
    formattedSelectedTotal,
    showRegisterBar,
    pagination,
    refetch,
    toggleInvoice,
    togglePage,
  ]);

  return (
    <>
      <WorkbenchPageShell
        title={workbenchCopy.title}
        description={workbenchCopy.description}
        beforeAwareness={
          followThrough ? (
            <FinanceCobrosFollowThroughAlert followThrough={followThrough} />
          ) : undefined
        }
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.bucketsAriaLabel}
        bucketsLoading={isLoading && invoices.length === 0}
        toolbar={{
          filters: (
            <RfcToolbarFilter onSubmit={onRfcSearch} />
          ),
          activeFilterChips: rfcChips,
          onClearFilters: rfcFromUrl ? onClearRfc : undefined,
          hasFilters: Boolean(rfcFromUrl),
          onRefresh: handleRefresh,
          isRefreshing: isLoading,
        }}
        renderContent={renderContent}
        pagination={
          activeBucket !== "rep_exceptions" && pagination
            ? {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit,
              }
            : undefined
        }
        onPageChange={activeBucket !== "rep_exceptions" ? handlePageChange : undefined}
      />

      {canRegisterPayment ? (
        <FinanceCobrosConfirmSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          invoices={selectedInvoices}
          total={selectedTotal}
          receiverRfc={searchRfc ?? ""}
          paymentDate={paymentDate}
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
