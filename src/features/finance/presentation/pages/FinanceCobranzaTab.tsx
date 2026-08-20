import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams, type SetURLSearchParams } from "react-router-dom";
import { getTodayMexicoDateString } from "@boeltech/cfdi-domain";
import {
  CircleDollarSign,
  FileText,
  ReceiptText,
  Search,
  Send,
} from "lucide-react";
import {
  FINANCE_COBROS_RFC_PARAM,
  OPEN_PPD_INVOICES_PAGE_SIZE,
  buildFinanceTabSearchParams,
  useOpenPpdInvoices,
  useRegisterFinancePayment,
} from "@features/finance/application";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { StatCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { ListingPagination, ListingResultsSummary } from "@shared/ui/listing";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { FinanceChainRepairConfirmDialog } from "../components/FinanceChainRepairConfirmDialog";
import { FinanceCobrosConfirmSheet } from "../components/FinanceCobrosConfirmSheet";
import { FinanceCobrosFollowThroughAlert } from "../components/FinanceCobrosFollowThroughAlert";
import { FinanceCobrosInvoiceTable } from "../components/FinanceCobrosInvoiceTable";
import { FinanceRepExceptionsSection } from "../components/FinanceRepExceptionsSection";
import {
  COBROS_PAYMENT_FORM,
  COBROS_PAYMENT_TIME,
} from "../config/financeCobrosConfig";
import { financeCopy } from "../copy";
import { getChainRepairAffectedLabels } from "../utils/chainRepairPlanLabels";
import {
  buildCobrosFollowThrough,
  readCobrosFollowThrough,
  writeCobrosFollowThrough,
  type CobrosFollowThrough,
} from "../utils/cobrosFollowThrough";

const copy = financeCopy.cobros;

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

export function FinanceCobranzaTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rfcFromUrl = (searchParams.get(FINANCE_COBROS_RFC_PARAM) ?? "")
    .trim()
    .toUpperCase();
  const [followThrough, setFollowThrough] = useState<CobrosFollowThrough | null>(
    () => readCobrosFollowThrough(),
  );

  const handlePaymentRegistered = (next: CobrosFollowThrough) => {
    writeCobrosFollowThrough(next);
    setFollowThrough(next);
  };

  return (
    <div className="space-y-6">
      {followThrough ? (
        <FinanceCobrosFollowThroughAlert followThrough={followThrough} />
      ) : null}
      <FinanceCobrosSession
        key={`session-${rfcFromUrl || "empty"}`}
        rfcFromUrl={rfcFromUrl}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        onPaymentRegistered={handlePaymentRegistered}
      />
      <FinanceRepExceptionsSection
        key={`exceptions-${rfcFromUrl || "all"}`}
        receiverRfc={rfcFromUrl || null}
      />
    </div>
  );
}

function FinanceCobrosSession({
  rfcFromUrl,
  searchParams,
  setSearchParams,
  onPaymentRegistered,
}: {
  rfcFromUrl: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  onPaymentRegistered: (followThrough: CobrosFollowThrough) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canRegisterPayment = hasPermission("finance", "create");
  const searchRfc = rfcFromUrl || null;

  const [rfcDraft, setRfcDraft] = useState(rfcFromUrl);
  const [isEditingRfc, setIsEditingRfc] = useState(!rfcFromUrl);
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

  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selected[invoice.id]),
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

  const pageBalance = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balanceDue.toFixed(2)),
        0,
      ),
    [invoices],
  );

  const formattedSelectedTotal = formatMxCurrency(selectedTotal);
  const paymentDate = getTodayMexicoDateString();
  const clientName = invoices[0]?.receiverName?.trim();
  const showSearchForm = !searchRfc || isEditingRfc;
  const showRegisterBar =
    canRegisterPayment && selectedInvoices.length > 0 && invoices.length > 0;

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
      for (const invoice of invoices) {
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

  const handleSearch = () => {
    const nextRfc = rfcDraft.trim().toUpperCase();
    if (!nextRfc) return;
    setSelected({});
    setPage(1);
    setIsEditingRfc(false);
    setSearchParams(
      buildFinanceTabSearchParams("cobros", {
        rfc: nextRfc,
        preserveFrom: searchParams,
      }),
      { replace: true },
    );
  };

  const handlePageChange = (nextPage: number) => {
    setSelected({});
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      {showSearchForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" aria-hidden />
              {copy.taskTitle}
            </CardTitle>
            <CardDescription>{copy.taskDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="receiver-rfc">{copy.receiverRfcLabel}</Label>
                <Input
                  id="receiver-rfc"
                  className="font-mono"
                  value={rfcDraft}
                  onChange={(event) =>
                    setRfcDraft(event.target.value.toUpperCase())
                  }
                  placeholder={copy.rfcPlaceholder}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && rfcDraft.trim()) {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                disabled={!rfcDraft.trim()}
                className="sm:w-auto"
              >
                {copy.search}
              </Button>
            </div>
            {!searchRfc ? (
              <p className="text-sm text-muted-foreground">
                {copy.summaryLink}{" "}
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link to="/finance?tab=summary">{copy.summaryLinkCta}</Link>
                </Button>
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {copy.rfcChip(searchRfc)}
          </Badge>
          {clientName ? (
            <span className="text-sm font-medium">{clientName}</span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditingRfc(true)}
          >
            {copy.changeRfc}
          </Button>
        </div>
      )}

      {searchRfc ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={<FileText className="h-5 w-5" aria-hidden />}
            title={copy.metrics.openInvoices}
            value={String(pagination?.total ?? invoices.length)}
            description={copy.metrics.pendingCredit}
            isLoading={isLoading && !pagination}
          />
          <StatCard
            icon={<CircleDollarSign className="h-5 w-5" aria-hidden />}
            title={copy.metrics.openBalance}
            value={formatMxCurrency(pageBalance)}
            description={
              pagination && pagination.totalPages > 1
                ? copy.metrics.thisPage
                : copy.metrics.pendingCredit
            }
            isLoading={isLoading && invoices.length === 0}
          />
        </div>
      ) : null}

      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.loadErrorTitle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              {copy.retry}
            </Button>
          </div>
        </AlertWithIcon>
      ) : null}

      {searchRfc && !isLoading && !isError && invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-8 w-8 text-muted-foreground" />}
          title={copy.emptyTitle}
          description={copy.empty}
          size="md"
          cta={{
            label: copy.changeRfc,
            onClick: () => setIsEditingRfc(true),
            variant: "outline",
          }}
        />
      ) : null}

      {searchRfc && (isLoading || invoices.length > 0) && !isError ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-base">{copy.tableTitle}</CardTitle>
                <CardDescription>{copy.tableDescription}</CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FinanceCobrosInvoiceTable
              invoices={invoices}
              selected={selected}
              isLoading={isLoading && invoices.length === 0}
              onToggle={toggleInvoice}
              onTogglePage={togglePage}
            />
            {pagination ? (
              <ListingPagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            ) : null}
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
          </CardContent>
        </Card>
      ) : null}

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
          isPending={isPending}
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
    </div>
  );
}
