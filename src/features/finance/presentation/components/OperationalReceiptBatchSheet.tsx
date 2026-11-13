/**
 * Sheet «Cobro por lote» — lectura + modo anulación (PRD D5).
 * Sin overlays apilados: void = modo del mismo Sheet.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HandCoins } from "lucide-react";

import {
  useOperationalReceiptBatch,
  useVoidOperationalReceiptBatch,
  buildTripCostsHref,
} from "@features/finance/application";
import {
  OPERATIONAL_PAYMENT_INSTRUMENT_LABELS,
  formatOperationalReceiptBatchLabel,
} from "@features/finance/domain";
import { isApiError } from "@shared/api/interceptors/error-handler";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Textarea } from "@shared/ui/text-area/textarea";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";

const copy = operationalReceiptBatchCopy;
const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-xl";

const voidSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, copy.sheet.voidReasonRequired)
    .max(250, copy.sheet.voidReasonMax),
});

type VoidFormValues = z.infer<typeof voidSchema>;

export interface OperationalReceiptBatchSheetProps {
  batchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BatchSheetBody({
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

  const voidForm = useForm<VoidFormValues>({
    resolver: zodResolver(voidSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    setMode("view");
    setInlineError(null);
    voidForm.reset({ reason: "" });
  }, [batchId, voidForm]);

  const voidMutation = useVoidOperationalReceiptBatch({
    onSuccess: (updated) => {
      toast({
        title: copy.toast.voidSuccess(updated.receiptCount),
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
        setInlineError(copy.sheet.r1Blocked(codes || "—"));
        return;
      }
      toast({
        title: copy.toast.voidError,
        description: error.message,
        variant: "error",
      });
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-3 py-2" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const notFound =
      isApiError(query.error) &&
      (query.error.status === 404 ||
        query.error.code === "OPERATIONAL_RECEIPT_BATCH_NOT_FOUND");
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {notFound ? copy.sheet.notFound : copy.sheet.loadError}
        </AlertTitle>
        {!notFound ? (
          <AlertDescription>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => void query.refetch()}
            >
              {copy.sheet.loadRetry}
            </Button>
          </AlertDescription>
        ) : null}
      </Alert>
    );
  }

  if (!batch) return null;

  const isVoided = batch.voidedAt != null;
  const instrumentLabel =
    OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[batch.paymentInstrument];
  const titleLabel = formatOperationalReceiptBatchLabel({
    collectedAt: batch.collectedAt,
    paymentInstrument: batch.paymentInstrument,
    reference: batch.reference,
    formatDate,
  });

  if (mode === "void" && !isVoided) {
    const reasonError = voidForm.formState.errors.reason?.message;
    return (
      <>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <p className="text-sm text-foreground">
            {copy.sheet.voidConfirm(batch.receiptCount)}
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {batch.receipts.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-2 tabular-nums"
              >
                <span className="font-mono">{r.tripCode}</span>
                <span>{formatMxCurrency(r.amount)}</span>
              </li>
            ))}
          </ul>
          {inlineError ? (
            <Alert variant="destructive">
              <AlertDescription>{inlineError}</AlertDescription>
            </Alert>
          ) : null}
          <form
            id="void-operational-receipt-batch"
            onSubmit={voidForm.handleSubmit((values) => {
              setInlineError(null);
              voidMutation.mutate({ batchId: batch.id, reason: values.reason });
            })}
            noValidate
          >
            <FormFieldShell
              fieldId="batch-void-reason"
              label={copy.sheet.voidReason}
              required
              errorMessage={reasonError}
            >
              <Textarea
                id="batch-void-reason"
                rows={3}
                placeholder={copy.sheet.voidReasonPlaceholder}
                disabled={voidMutation.isPending}
                error={Boolean(reasonError)}
                {...voidForm.register("reason")}
                {...getFieldErrorAriaProps("batch-void-reason", reasonError)}
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
            disabled={voidMutation.isPending}
            onClick={() => {
              setMode("view");
              setInlineError(null);
            }}
          >
            {copy.sheet.voidBack}
          </Button>
          <Button
            type="submit"
            form="void-operational-receipt-batch"
            variant="destructive"
            disabled={voidMutation.isPending}
          >
            {voidMutation.isPending
              ? "Anulando…"
              : copy.sheet.voidSubmit(batch.receiptCount)}
          </Button>
        </SheetFooter>
      </>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
        <div className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(batch.amount)}
          </p>
          <p className="text-sm text-muted-foreground">{titleLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isVoided ? "neutral" : "info"}
              tone="soft"
            >
              {isVoided ? copy.sheet.statusVoided : copy.sheet.statusActive}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {instrumentLabel}
              {batch.reference ? ` · ${batch.reference}` : ""}
            </span>
          </div>
          {batch.note ? (
            <p className="text-sm text-muted-foreground">{batch.note}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {copy.sheet.registeredBy(
              batch.createdByName?.trim() || "—",
              formatDateTime(batch.createdAt),
            )}
          </p>
          {isVoided && batch.voidReason ? (
            <p className="text-xs text-muted-foreground">
              {batch.voidReason}
              {batch.voidedByName
                ? ` · ${batch.voidedByName}`
                : ""}
              {batch.voidedAt
                ? ` · ${formatDateTime(batch.voidedAt)}`
                : ""}
            </p>
          ) : null}
        </div>

        {inlineError ? (
          <Alert variant="destructive">
            <AlertDescription>{inlineError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.sheet.columns.trip}</TableHead>
                <TableHead>{copy.sheet.columns.departure}</TableHead>
                <TableHead className="text-right">
                  {copy.sheet.columns.amount}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.receipts.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">
                    <Link
                      to={buildTripCostsHref(r.tripId)}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {r.tripCode}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.scheduledDeparture
                      ? formatDate(r.scheduledDeparture)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMxCurrency(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {copy.sheet.close}
        </Button>
        {canVoid && !isVoided ? (
          <Button
            type="button"
            variant="outline"
            className="text-destructive"
            onClick={() => {
              setInlineError(null);
              setMode("void");
            }}
          >
            {copy.sheet.voidCta}
          </Button>
        ) : null}
      </SheetFooter>
    </>
  );
}

export function OperationalReceiptBatchSheet({
  batchId,
  open,
  onOpenChange,
}: OperationalReceiptBatchSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="inline-flex items-center gap-2">
            <HandCoins className="h-5 w-5 shrink-0" />
            {copy.sheet.title}
          </SheetTitle>
        </SheetHeader>
        {open && batchId ? (
          <BatchSheetBody
            key={batchId}
            batchId={batchId}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
