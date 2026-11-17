/**
 * Hoja unificada «Cobro» (F3 · C17–C21).
 * Discriminante: payment_id | batch_id | receipt_id (legacy).
 * Anular solo sin factura (Q8).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HandCoins } from "lucide-react";

import {
  useOperationalReceiptBatch,
  useVoidOperationalReceiptBatch,
  buildTripCostsHref,
  usePaymentCollectionDetail,
  useReceiptCollectionDetail,
  useRetryPaymentRep,
  useOpenPaymentRepPdf,
  useDownloadPaymentRepXml,
  useVoidOperationalCashReceiptFromCollection,
} from "@features/finance/application";
import {
  OPERATIONAL_PAYMENT_INSTRUMENT_LABELS,
  type CollectionDetailTarget,
  type FinanceRepLiveStatus,
  type PaymentCollectionAllocation,
} from "@features/finance/domain";
import { invoiceQueryKeys } from "@features/invoicing/application";
import { SendRepDialog, invoicingApi } from "@features/invoicing";
import type { Invoice } from "@features/invoicing/domain";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { Textarea } from "@shared/ui/text-area/textarea";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { collectionDetailCopy } from "../copy/collectionDetailCopy";
import {
  allocationNeedsRepEnrich,
  resolveAllocationRepFields,
  type InvoiceBalanceContext,
} from "../utils/collectionAllocationBalances";

const REP_STATUS_LABEL: Record<FinanceRepLiveStatus, string> = {
  not_required: "No aplica",
  pending: "En proceso",
  stamped: "Timbrado",
  failed: "Falló",
  restamp_pending: "Reintento",
  cancelling: "Cancelando",
  cancelled: "Cancelado",
};

function RepStatusChip({ status }: { status: FinanceRepLiveStatus | string }) {
  const key = status as FinanceRepLiveStatus;
  const label = REP_STATUS_LABEL[key] ?? String(status);
  const variant =
    key === "stamped"
      ? "success"
      : key === "failed"
        ? "destructive"
        : key === "pending" ||
            key === "restamp_pending" ||
            key === "cancelling"
          ? "warning"
          : "neutral";
  return (
    <Badge variant={variant} tone="soft">
      {label}
    </Badge>
  );
}

const copy = collectionDetailCopy;
const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-xl";

const voidSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, copy.void.reasonRequired)
    .max(250, copy.void.reasonMax),
});

type VoidFormValues = z.infer<typeof voidSchema>;

export interface CollectionDetailSheetProps {
  target: CollectionDetailTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cuando el sheet abre otro cobro (p. ej. bloqueante). */
  onNavigateTarget?: (target: CollectionDetailTarget) => void;
}

type AllocRow = {
  id: string;
  label: string;
  href: string | null;
  departure: string | null;
  installment: number | null;
  balanceBefore: number | null;
  amount: number;
  balanceAfter: number | null;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="space-y-3 py-2" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function ErrorBody({
  notFound,
  onRetry,
}: {
  notFound: boolean;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{notFound ? copy.load.notFound : copy.load.error}</AlertTitle>
      {!notFound ? (
        <AlertDescription>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onRetry}
          >
            {copy.load.retry}
          </Button>
        </AlertDescription>
      ) : null}
    </Alert>
  );
}

function VoidModeBody({
  confirmText,
  submitLabel,
  formId,
  inlineError,
  isPending,
  onBack,
  onSubmit,
}: {
  confirmText: string;
  submitLabel: string;
  formId: string;
  inlineError: string | null;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (reason: string) => void;
}) {
  const voidForm = useForm<VoidFormValues>({
    resolver: zodResolver(voidSchema),
    defaultValues: { reason: "" },
  });
  const reasonError = voidForm.formState.errors.reason?.message;

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
        <p className="text-sm text-foreground">{confirmText}</p>
        {inlineError ? (
          <Alert variant="destructive">
            <AlertDescription>{inlineError}</AlertDescription>
          </Alert>
        ) : null}
        <form
          id={formId}
          onSubmit={voidForm.handleSubmit((values) => onSubmit(values.reason))}
          noValidate
        >
          <FormFieldShell
            fieldId={`${formId}-reason`}
            label={copy.void.reason}
            required
            errorMessage={reasonError}
          >
            <Textarea
              id={`${formId}-reason`}
              rows={3}
              placeholder={copy.void.reasonPlaceholder}
              disabled={isPending}
              error={Boolean(reasonError)}
              {...voidForm.register("reason")}
              {...getFieldErrorAriaProps(`${formId}-reason`, reasonError)}
            />
          </FormFieldShell>
          {voidForm.formState.isSubmitted && reasonError ? (
            <FormValidationSummary messages={[reasonError]} />
          ) : null}
        </form>
      </div>
      <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onBack}
        >
          {copy.void.back}
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="destructive"
          disabled={isPending}
        >
          {isPending ? copy.void.pending : submitLabel}
        </Button>
      </SheetFooter>
    </>
  );
}

function AllocatedTable({
  title,
  rows,
  mode,
}: {
  title: string;
  rows: AllocRow[];
  mode: "invoice" | "trip";
}) {
  const columns: EntityListColumnDef<AllocRow>[] = useMemo(
    () => [
      {
        id: "entity",
        header:
          mode === "invoice"
            ? copy.allocatedIn.columns.invoice
            : copy.allocatedIn.columns.trip,
        kind: "primary",
        accessor: (row) =>
          row.href ? (
            <Link
              to={row.href}
              className="text-primary underline-offset-2 hover:underline"
            >
              {row.label}
            </Link>
          ) : (
            row.label
          ),
      },
      ...(mode === "trip"
        ? ([
            {
              id: "departure",
              header: copy.allocatedIn.columns.departure,
              kind: "date" as const,
              accessor: (row: AllocRow) => row.departure,
            },
          ] as EntityListColumnDef<AllocRow>[])
        : ([
            {
              id: "installment",
              header: copy.allocatedIn.columns.installment,
              kind: "number" as const,
              accessor: (row: AllocRow) => row.installment ?? copy.fields.emDash,
            },
            {
              id: "balanceBefore",
              header: copy.allocatedIn.columns.balanceBefore,
              kind: "money" as const,
              accessor: (row: AllocRow) => row.balanceBefore,
            },
          ] as EntityListColumnDef<AllocRow>[])),
      {
        id: "amount",
        header: copy.allocatedIn.columns.amount,
        kind: "money",
        accessor: (row) => row.amount,
      },
      {
        id: "balanceAfter",
        header: copy.allocatedIn.columns.balanceAfter,
        kind: "money",
        accessor: (row) => row.balanceAfter,
      },
    ],
    [mode],
  );

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <EntityListTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        density="compact"
        framed={false}
        summaryRow={{
          label: copy.allocatedIn.total,
          cells: { amount: total },
        }}
      />
    </div>
  );
}

function invoiceToBalanceContext(invoice: Invoice): InvoiceBalanceContext {
  return {
    total: invoice.total,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amountMxn: p.amountMxn,
      paymentDate: p.paymentDate,
      paymentTime: p.paymentTime,
      repImpPagado: p.repImpPagado,
      repImpSaldoAnt: p.repImpSaldoAnt,
      repImpSaldoInsoluto: p.repImpSaldoInsoluto,
      repNumParcialidad: p.repNumParcialidad,
    })),
  };
}

function buildInvoiceAllocRows(
  paymentId: string,
  allocations: PaymentCollectionAllocation[],
  invoicesById: Map<string, InvoiceBalanceContext>,
): AllocRow[] {
  return allocations.map((a) => {
    const folio =
      a.serie && a.folio != null
        ? `${a.serie}-${a.folio}`
        : a.ingressInvoiceId.slice(0, 8);
    const rep = resolveAllocationRepFields(
      a,
      paymentId,
      invoicesById.get(a.ingressInvoiceId),
    );
    return {
      id: a.id,
      label: folio,
      href: `/invoices/${a.ingressInvoiceId}`,
      departure: null,
      installment: rep.installment,
      balanceBefore: rep.balanceBefore,
      amount: a.amount,
      balanceAfter: rep.balanceAfter,
    };
  });
}

function PaymentBody({
  paymentId,
  onOpenChange,
  onNavigateTarget,
}: {
  paymentId: string;
  onOpenChange: (open: boolean) => void;
  onNavigateTarget?: (target: CollectionDetailTarget) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");
  const [sendOpen, setSendOpen] = useState(false);

  const query = usePaymentCollectionDetail(paymentId, { enabled: true });
  const detail = query.data;

  const invoiceIdsNeedingEnrich = useMemo(() => {
    const allocations = detail?.allocations ?? [];
    const ids = allocations
      .filter(allocationNeedsRepEnrich)
      .map((a) => a.ingressInvoiceId)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [detail?.allocations]);

  const invoiceQueries = useQueries({
    queries: invoiceIdsNeedingEnrich.map((invoiceId) => ({
      queryKey: invoiceQueryKeys.detail(invoiceId),
      queryFn: () => invoicingApi.getById(invoiceId),
      staleTime: 30_000,
      enabled: Boolean(invoiceId),
    })),
  });

  const invoiceDataVersion = invoiceQueries
    .map((q) => q.data?.id ?? q.fetchStatus)
    .join("|");

  const invoicesById = useMemo(() => {
    const map = new Map<string, InvoiceBalanceContext>();
    invoiceIdsNeedingEnrich.forEach((invoiceId, index) => {
      const data = invoiceQueries[index]?.data;
      if (data) {
        map.set(invoiceId, invoiceToBalanceContext(data));
      }
    });
    return map;
    // invoiceDataVersion tracks query data identity without unstable array deps
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see invoiceDataVersion
  }, [invoiceIdsNeedingEnrich, invoiceDataVersion]);

  const invoiceEnrichPending =
    invoiceIdsNeedingEnrich.length > 0 &&
    invoiceQueries.some((q) => q.isPending && q.data == null);

  const retryMutation = useRetryPaymentRep({
    onSuccess: () => toast({ title: copy.toast.retrySuccess, variant: "success" }),
    onError: (err) =>
      toast({
        title: copy.toast.retryError,
        description: getErrorMessage(err),
        variant: "error",
      }),
  });

  const openPdf = useOpenPaymentRepPdf({
    onError: (err) =>
      toast({
        title: copy.toast.pdfError,
        description: getErrorMessage(err),
        variant: "error",
      }),
  });
  const downloadXml = useDownloadPaymentRepXml({
    onError: (err) =>
      toast({
        title: copy.toast.xmlError,
        description: getErrorMessage(err),
        variant: "error",
      }),
  });

  if (query.isLoading || invoiceEnrichPending) return <LoadingBody />;
  if (query.isError) {
    const notFound =
      isApiError(query.error) &&
      (query.error.status === 404 ||
        query.error.code === "PAYMENT_NOT_FOUND");
    return (
      <ErrorBody notFound={notFound} onRetry={() => void query.refetch()} />
    );
  }
  if (!detail) return null;

  const comprobante = detail.comprobante;
  const allocRows: AllocRow[] = buildInvoiceAllocRows(
    paymentId,
    detail.allocations,
    invoicesById,
  );

  const formLabel =
    detail.paymentFormName != null
      ? `${detail.paymentForm} · ${detail.paymentFormName}`
      : detail.paymentForm;
  const clientLine = detail.clientName?.trim() || copy.fields.emDash;

  const stamped = comprobante.repStatus === "stamped";
  const canSend = canExecute && stamped;
  const canRetry =
    canExecute &&
    (comprobante.repStatus === "failed" ||
      comprobante.repStatus === "restamp_pending");
  const blockingId = comprobante.blockingPaymentId;
  const showFiles = stamped && Boolean(comprobante.repUuid);
  const serieFolio = comprobante.repSerieFolio ?? "REP";
  const primaryCta: "send" | "retry" | "blocking" | "close" = blockingId
    ? "blocking"
    : canRetry
      ? "retry"
      : canSend
        ? "send"
        : "close";

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" tone="soft">
              {copy.channelWithInvoice}
            </Badge>
            <Badge variant="success" tone="soft">
              {copy.statusActive}
            </Badge>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(detail.amountMxn)}
          </p>
          <p className="text-sm text-muted-foreground">{clientLine}</p>
        </div>

        <div className="space-y-2">
          <MetaRow
            label={copy.fields.collectedAt}
            value={`${formatDate(detail.paymentDate)}${
              detail.paymentTime
                ? ` · ${detail.paymentTime.slice(0, 5)}`
                : ""
            }`}
          />
          <MetaRow label={copy.fields.paymentForm} value={formLabel} />
          <MetaRow
            label={copy.fields.reference}
            value={detail.reference?.trim() || copy.fields.emDash}
          />
          <MetaRow
            label={copy.fields.registeredBy}
            value={copy.registeredBy(
              detail.createdByName?.trim() || copy.fields.emDash,
              formatDateTime(detail.createdAt),
            )}
          />
        </div>

        {allocRows.length > 0 ? (
          <AllocatedTable
            title={copy.allocatedIn.invoices(allocRows.length)}
            rows={allocRows}
            mode="invoice"
          />
        ) : null}

        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{copy.comprobante.title}</h3>
            {comprobante.repSerieFolio ? (
              <span className="font-mono text-xs text-muted-foreground">
                {comprobante.repSerieFolio}
              </span>
            ) : null}
            <RepStatusChip status={comprobante.repStatus} />
          </div>
          {comprobante.stampedAt ? (
            <p className="text-xs text-muted-foreground">
              {formatDateTime(comprobante.stampedAt)}
            </p>
          ) : null}
          {comprobante.repUuid ? (
            <p className="font-mono text-xs break-all">{comprobante.repUuid}</p>
          ) : null}
          {comprobante.fiscalDeadline ? (
            <p className="text-xs text-muted-foreground">
              Plazo SAT · {formatDate(comprobante.fiscalDeadline.date)} ·{" "}
              {comprobante.fiscalDeadline.status}
            </p>
          ) : null}
          {comprobante.repAttempts > 0 ? (
            <p className="text-xs text-muted-foreground">
              {copy.comprobante.attempts(comprobante.repAttempts)}
            </p>
          ) : null}
          {comprobante.lastError ? (
            <p className="font-mono text-xs text-destructive whitespace-pre-wrap">
              {comprobante.lastError}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {copy.comprobante.multiInvoiceHint(Math.max(1, allocRows.length))}
            {" · "}
            {comprobante.dispatchSentAt
              ? copy.comprobante.sent
              : copy.comprobante.notSent}
          </p>
          {showFiles ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={openPdf.isPending}
                onClick={() =>
                  openPdf.mutate({
                    paymentId,
                    filename: `rep-${serieFolio}.pdf`,
                  })
                }
              >
                {copy.comprobante.pdf}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadXml.isPending}
                onClick={() =>
                  downloadXml.mutate({
                    paymentId,
                    filename: `rep-${serieFolio}.xml`,
                  })
                }
              >
                {copy.comprobante.xml}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        {primaryCta !== "close" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        ) : null}
        {primaryCta === "blocking" && blockingId ? (
          <Button
            type="button"
            onClick={() =>
              onNavigateTarget?.({ kind: "payment", paymentId: blockingId })
            }
          >
            {copy.cta.openBlocking}
          </Button>
        ) : null}
        {primaryCta === "retry" ? (
          <Button
            type="button"
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate({ paymentId })}
          >
            {copy.cta.retryStamp}
          </Button>
        ) : null}
        {primaryCta === "send" ? (
          <Button type="button" onClick={() => setSendOpen(true)}>
            {comprobante.dispatchSentAt ? copy.cta.resend : copy.cta.send}
          </Button>
        ) : null}
        {primaryCta === "close" ? (
          <Button type="button" onClick={() => onOpenChange(false)}>
            {copy.close}
          </Button>
        ) : null}
      </SheetFooter>

      {sendOpen ? (
        <SendRepDialog
          paymentId={paymentId}
          open={sendOpen}
          onOpenChange={setSendOpen}
          alreadySent={Boolean(comprobante.dispatchSentAt)}
          onSent={() => {
            setSendOpen(false);
            void query.refetch();
          }}
        />
      ) : null}
    </>
  );
}

function BatchBody({
  batchId,
  onOpenChange,
}: {
  batchId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canVoid = hasPermission("operational_cash", "void");
  const [mode, setMode] = useState<"view" | "void">("view");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const query = useOperationalReceiptBatch(batchId, { enabled: true });
  const batch = query.data;

  const voidMutation = useVoidOperationalReceiptBatch({
    onSuccess: (updated) => {
      toast({
        title: copy.toast.voidBatchSuccess(updated.receiptCount),
        variant: "success",
      });
      setMode("view");
      setInlineError(null);
    },
    onError: (error) => {
      if (!isApiError(error)) {
        toast({ title: copy.toast.voidError, variant: "error" });
        return;
      }
      if (error.code === "OPERATIONAL_RECEIPT_BATCH_ALREADY_VOIDED") {
        toast({ title: copy.toast.alreadyVoided, variant: "warning" });
        void query.refetch();
        setMode("view");
        return;
      }
      if (error.code === "OPERATIONAL_RECEIPT_BATCH_TRIPS_NOT_SIN_FACTURA") {
        const trips = (
          error.details as { trips?: { trip_code?: string }[] } | undefined
        )?.trips;
        const codes = (trips ?? [])
          .map((t) => t.trip_code)
          .filter(Boolean)
          .join(", ");
        setInlineError(
          `No se puede anular: ${codes || "—"} pasaron a Con factura.`,
        );
        return;
      }
      toast({
        title: copy.toast.voidError,
        description: error.message,
        variant: "error",
      });
    },
  });

  if (query.isLoading) return <LoadingBody />;
  if (query.isError) {
    const notFound =
      isApiError(query.error) &&
      (query.error.status === 404 ||
        query.error.code === "OPERATIONAL_RECEIPT_BATCH_NOT_FOUND");
    return (
      <ErrorBody notFound={notFound} onRetry={() => void query.refetch()} />
    );
  }
  if (!batch) return null;

  const isVoided = batch.voidedAt != null;
  const instrumentLabel =
    OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[batch.paymentInstrument];

  if (mode === "void" && !isVoided) {
    return (
      <VoidModeBody
        confirmText={copy.void.confirmBatch(batch.receiptCount)}
        submitLabel={copy.void.submitBatch(batch.receiptCount)}
        formId="void-collection-batch"
        inlineError={inlineError}
        isPending={voidMutation.isPending}
        onBack={() => {
          setMode("view");
          setInlineError(null);
        }}
        onSubmit={(reason) => {
          setInlineError(null);
          voidMutation.mutate({ batchId: batch.id, reason });
        }}
      />
    );
  }

  const allocRows: AllocRow[] = batch.receipts.map((r) => ({
    id: r.id,
    label: r.tripCode,
    href: buildTripCostsHref(r.tripId),
    departure: r.scheduledDeparture,
    installment: null,
    balanceBefore: null,
    amount: r.amount,
    balanceAfter: null,
  }));

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" tone="soft">
              {copy.channelWithoutInvoice}
            </Badge>
            <Badge variant={isVoided ? "neutral" : "success"} tone="soft">
              {isVoided ? copy.statusVoided : copy.statusActive}
            </Badge>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(batch.amount)}
          </p>
          <p className="text-sm text-muted-foreground">
            {batch.clientName?.trim() || copy.fields.emDash}
          </p>
        </div>

        <div className="space-y-2">
          <MetaRow
            label={copy.fields.collectedAt}
            value={formatDate(batch.collectedAt)}
          />
          <MetaRow label={copy.fields.paymentForm} value={instrumentLabel} />
          <MetaRow
            label={copy.fields.reference}
            value={batch.reference?.trim() || copy.fields.emDash}
          />
          {batch.note ? (
            <MetaRow label={copy.fields.note} value={batch.note} />
          ) : null}
          <MetaRow
            label={copy.fields.registeredBy}
            value={copy.registeredBy(
              batch.createdByName?.trim() || copy.fields.emDash,
              formatDateTime(batch.createdAt),
            )}
          />
          {isVoided && batch.voidReason ? (
            <p className="text-xs text-muted-foreground">
              {batch.voidReason}
              {batch.voidedByName ? ` · ${batch.voidedByName}` : ""}
              {batch.voidedAt ? ` · ${formatDateTime(batch.voidedAt)}` : ""}
            </p>
          ) : null}
        </div>

        {inlineError ? (
          <Alert variant="destructive">
            <AlertDescription>{inlineError}</AlertDescription>
          </Alert>
        ) : null}

        {allocRows.length > 0 ? (
          <AllocatedTable
            title={copy.allocatedIn.trips(allocRows.length)}
            rows={allocRows}
            mode="trip"
          />
        ) : null}

        <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3">
          <h3 className="text-sm font-medium">{copy.comprobante.title}</h3>
          <p className="text-sm font-medium">
            {copy.comprobante.notEmittedTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {copy.comprobante.notEmittedBody}
          </p>
        </div>
      </div>

      <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {canVoid && !isVoided ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive sm:mr-auto"
            onClick={() => {
              setInlineError(null);
              setMode("void");
            }}
          >
            {copy.void.cta}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={() => onOpenChange(false)}>
          {copy.close}
        </Button>
      </SheetFooter>
    </>
  );
}

function ReceiptBody({
  receiptId,
  onOpenChange,
  onNavigateTarget,
}: {
  receiptId: string;
  onOpenChange: (open: boolean) => void;
  onNavigateTarget?: (target: CollectionDetailTarget) => void;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canVoid = hasPermission("operational_cash", "void");
  const [mode, setMode] = useState<"view" | "void">("view");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const query = useReceiptCollectionDetail(receiptId, { enabled: true });
  const detail = query.data;

  useEffect(() => {
    if (detail?.batchId) {
      onNavigateTarget?.({ kind: "batch", batchId: detail.batchId });
    }
  }, [detail?.batchId, onNavigateTarget]);

  const voidMutation = useVoidOperationalCashReceiptFromCollection({
    onSuccess: () => {
      toast({ title: copy.toast.voidReceiptSuccess, variant: "success" });
      setMode("view");
      void query.refetch();
    },
    onError: (error) => {
      if (!isApiError(error)) {
        toast({ title: copy.toast.voidError, variant: "error" });
        return;
      }
      toast({
        title: copy.toast.voidError,
        description: error.message,
        variant: "error",
      });
    },
  });

  if (query.isLoading || detail?.batchId) return <LoadingBody />;
  if (query.isError) {
    const notFound =
      isApiError(query.error) &&
      (query.error.status === 404 ||
        query.error.code === "OPERATIONAL_CASH_RECEIPT_NOT_FOUND");
    return (
      <ErrorBody notFound={notFound} onRetry={() => void query.refetch()} />
    );
  }
  if (!detail) return null;

  const isVoided = detail.voidedAt != null;
  const instrumentLabel =
    OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[detail.paymentInstrument];

  if (mode === "void" && !isVoided) {
    return (
      <VoidModeBody
        confirmText={copy.void.confirmReceipt}
        submitLabel={copy.void.submitReceipt}
        formId="void-collection-receipt"
        inlineError={inlineError}
        isPending={voidMutation.isPending}
        onBack={() => {
          setMode("view");
          setInlineError(null);
        }}
        onSubmit={(reason) => {
          setInlineError(null);
          voidMutation.mutate({
            tripId: detail.tripId,
            receiptId: detail.id,
            reason,
          });
        }}
      />
    );
  }

  const allocRows: AllocRow[] = [
    {
      id: detail.id,
      label: detail.tripId.slice(0, 8).toUpperCase(),
      href: `/trips/${detail.tripId}`,
      departure: null,
      installment: null,
      balanceBefore: null,
      amount: detail.amount,
      balanceAfter: null,
    },
  ];

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" tone="soft">
              {copy.channelWithoutInvoice}
            </Badge>
            <Badge variant={isVoided ? "neutral" : "success"} tone="soft">
              {isVoided ? copy.statusVoided : copy.statusActive}
            </Badge>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(detail.amount)}
          </p>
        </div>

        <div className="space-y-2">
          <MetaRow
            label={copy.fields.collectedAt}
            value={formatDate(detail.collectedAt)}
          />
          <MetaRow label={copy.fields.paymentForm} value={instrumentLabel} />
          <MetaRow
            label={copy.fields.reference}
            value={detail.reference?.trim() || copy.fields.emDash}
          />
          {detail.note ? (
            <MetaRow label={copy.fields.note} value={detail.note} />
          ) : null}
          <MetaRow
            label={copy.fields.registeredBy}
            value={formatDateTime(detail.createdAt)}
          />
          {isVoided && detail.voidReason ? (
            <p className="text-xs text-muted-foreground">{detail.voidReason}</p>
          ) : null}
        </div>

        <AllocatedTable
          title={copy.allocatedIn.trips(1)}
          rows={allocRows}
          mode="trip"
        />

        <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3">
          <h3 className="text-sm font-medium">{copy.comprobante.title}</h3>
          <p className="text-sm font-medium">
            {copy.comprobante.notEmittedTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {copy.comprobante.notEmittedBody}
          </p>
        </div>
      </div>

      <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {canVoid && !isVoided ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive sm:mr-auto"
            onClick={() => {
              setInlineError(null);
              setMode("void");
            }}
          >
            {copy.void.cta}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={() => onOpenChange(false)}>
          {copy.close}
        </Button>
      </SheetFooter>
    </>
  );
}

function SheetBody({
  target,
  onOpenChange,
  onNavigateTarget,
}: {
  target: CollectionDetailTarget;
  onOpenChange: (open: boolean) => void;
  onNavigateTarget?: (target: CollectionDetailTarget) => void;
}) {
  if (target.kind === "payment") {
    return (
      <PaymentBody
        paymentId={target.paymentId}
        onOpenChange={onOpenChange}
        onNavigateTarget={onNavigateTarget}
      />
    );
  }
  if (target.kind === "batch") {
    return <BatchBody batchId={target.batchId} onOpenChange={onOpenChange} />;
  }
  return (
    <ReceiptBody
      receiptId={target.receiptId}
      onOpenChange={onOpenChange}
      onNavigateTarget={onNavigateTarget}
    />
  );
}

export function CollectionDetailSheet({
  target,
  open,
  onOpenChange,
  onNavigateTarget,
}: CollectionDetailSheetProps) {
  const bodyKey =
    target == null
      ? "closed"
      : target.kind === "payment"
        ? `payment:${target.paymentId}`
        : target.kind === "batch"
          ? `batch:${target.batchId}`
          : `receipt:${target.receiptId}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="inline-flex items-center gap-2">
            <HandCoins className="h-5 w-5 shrink-0" aria-hidden />
            {copy.title}
          </SheetTitle>
        </SheetHeader>
        {open && target ? (
          <SheetBody
            key={bodyKey}
            target={target}
            onOpenChange={onOpenChange}
            onNavigateTarget={onNavigateTarget}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
