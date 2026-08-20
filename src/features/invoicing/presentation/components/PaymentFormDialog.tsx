import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  computeRepFiscalDeadline,
  computeRepInstallmentContext,
  getTodayMexicoDateString,
  sortPaymentsForInstallment,
} from "@boeltech/cfdi-domain";
import { RepChainRepairConfirmDialog } from "./RepChainRepairConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFCatalogField,
  RHFDateField,
  RHFMoneyField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { HintIcon } from "@shared/ui/hint-icon";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { FormaPagoSelect } from "@features/catalogs/presentation/components";
import { useRegisterPayment } from "@features/invoicing/application";
import {
  getInvoiceDisplayAmounts,
  type CreatePaymentPayload,
  type Invoice,
} from "@features/invoicing/domain";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;
const formCopy = copy.paymentForm;

const schema = z.object({
  amount: z.coerce
    .number()
    .refine((n) => !Number.isNaN(n), {
      message: formCopy.validation.amountRequired,
    })
    .positive(formCopy.validation.amountPositive),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, formCopy.validation.paymentDateFormat),
  payment_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, formCopy.validation.paymentTimeFormat)
    .optional()
    .default("12:00"),
  payment_form: z.string().min(1, formCopy.validation.paymentFormRequired),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildDefaultValues(invoice: Invoice): FormValues {
  const { balanceDue } = getInvoiceDisplayAmounts(invoice);
  return {
    amount: balanceDue > 0 ? Number(balanceDue.toFixed(2)) : 0,
    payment_date: getTodayMexicoDateString(),
    payment_time: "12:00",
    payment_form: "03",
    reference: "",
    notes: "",
  };
}

function buildPayload(
  values: FormValues,
  invoice: Invoice,
  exchangeRate: number,
  confirmChainRepair?: boolean,
): CreatePaymentPayload {
  return {
    amount: values.amount,
    currency: invoice.currency,
    exchangeRate,
    paymentDate: values.payment_date,
    paymentTime:
      values.payment_time?.length === 5
        ? `${values.payment_time}:00`
        : values.payment_time,
    paymentForm: values.payment_form,
    reference: values.reference || undefined,
    notes: values.notes || undefined,
    confirmChainRepair,
  };
}

function PaymentFormDialogInner({ invoice, onOpenChange }: Omit<Props, "open">) {
  const { toast } = useToast();
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: copy.paymentErrorTitle,
      seeInlineCopy: copy.overlayErrorSeeInline,
      toast,
    });
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [chainRepairOpen, setChainRepairOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CreatePaymentPayload | null>(
    null,
  );
  const { balanceDue, totalPaid } = getInvoiceDisplayAmounts(invoice);
  const remainingBalance = Number(balanceDue.toFixed(2));
  const hasPendingBalance = remainingBalance > 0;
  const exchangeRate = invoice.exchangeRate ?? 1;
  const isPpd = invoice.paymentMethod === "PPD";
  const clientName = invoice.receiverName?.trim() || "—";

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: buildDefaultValues(invoice),
    mode: "onChange",
  });

  const submitSuccess = () => {
    toast({ title: copy.toast.paymentRegistered });
    form.reset();
    setChainRepairOpen(false);
    setPendingPayload(null);
    onOpenChange(false);
  };

  const { mutate, isPending } = useRegisterPayment(invoice.id, {
    onSuccess: submitSuccess,
    onError: (err) => {
      if (err instanceof ApiError && err.code === "CHAIN_REORDER_REQUIRED") {
        setChainRepairOpen(true);
        return;
      }
      showOverlayError(getErrorMessage(err));
    },
  });

  const watchedAmount = form.watch("amount");
  const watchedPaymentDate = form.watch("payment_date");

  const installmentPreview = useMemo(() => {
    if (!isPpd || !watchedPaymentDate) return null;
    const sorted = sortPaymentsForInstallment(
      invoice.payments.map((p) => ({
        id: p.id,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      })),
    );
    const priorPaid = sorted.reduce((sum, p) => {
      const payment = invoice.payments.find((row) => row.id === p.id);
      return sum + (payment ? payment.amount * payment.exchangeRate : 0);
    }, 0);
    const amount = Number(watchedAmount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const ctx = computeRepInstallmentContext({
      invoiceTotal: invoice.total,
      priorPaidTotal: priorPaid,
      priorPaymentsCount: sorted.length,
      paymentAmount: amount,
      exchangeRate,
      paymentDate: watchedPaymentDate,
      paymentForm: "03",
      paymentCurrency: invoice.currency,
    });
    return ctx.installmentNumber;
  }, [
    exchangeRate,
    invoice.currency,
    invoice.payments,
    invoice.total,
    isPpd,
    watchedAmount,
    watchedPaymentDate,
  ]);

  const submitPayload = (payload: CreatePaymentPayload) => {
    setPendingPayload(payload);
    mutate(payload);
  };

  const submitValues = (values: FormValues, confirmChainRepair?: boolean) => {
    if (!hasPendingBalance) {
      toast({
        variant: "destructive",
        title: formCopy.noBalanceTitle,
        description: formCopy.noBalanceDescription,
      });
      return;
    }

    if (values.amount > remainingBalance) {
      toast({
        variant: "destructive",
        title: formCopy.amountExceedsTitle,
        description: formCopy.amountExceedsDescription,
      });
      return;
    }

    submitPayload(buildPayload(values, invoice, exchangeRate, confirmChainRepair));
  };

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      clearOverlayError();
      submitValues(values);
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

  const lateRegistrationHint = useMemo(() => {
    if (!watchedPaymentDate || !isPpd) return null;
    const { status } = computeRepFiscalDeadline({
      paymentDate: watchedPaymentDate,
      repStatus: "pending",
      todayInMexico: getTodayMexicoDateString(),
    });
    if (status !== "overdue") return null;
    return copy.hint.paymentLateRegistrationHint;
  }, [watchedPaymentDate, isPpd]);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-1">
          <DialogTitle>{formCopy.title}</DialogTitle>
          {isPpd ? (
            <HintIcon label={formCopy.ppdHintLabel}>{formCopy.ppdHint}</HintIcon>
          ) : null}
        </div>
        <DialogDescription>
          {formCopy.contextLine(invoice.serie, invoice.folio, clientName)}
        </DialogDescription>
      </DialogHeader>

      <div className="mb-1 rounded-lg border bg-muted/40 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">{formCopy.balanceDue}</p>
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {formatMxCurrency(balanceDue)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            {formCopy.total}:{" "}
            <span className="tabular-nums text-foreground/80">
              {formatMxCurrency(invoice.total)}
            </span>
          </span>
          <span>
            {formCopy.paid}:{" "}
            <span className="tabular-nums text-foreground/80">
              {formatMxCurrency(totalPaid)}
            </span>
          </span>
        </div>
      </div>

      {!hasPendingBalance ? (
        <p className="mb-2 text-xs text-muted-foreground">
          {formCopy.settledMessage}
        </p>
      ) : null}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {submissionError ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.paymentErrorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {submissionError}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <RHFMoneyField
            control={form.control}
            name="amount"
            fieldId="amount"
            label={formCopy.amount}
            required
            disabled={!hasPendingBalance}
          />
          <RHFDateField
            control={form.control}
            name="payment_date"
            label={formCopy.paymentDate}
            required
            disabled={!hasPendingBalance}
          />
        </div>

        <RHFCatalogField
          control={form.control}
          name="payment_form"
          label={formCopy.paymentForm}
          required
        >
          {({ field, fieldState, resolvedId, errorMessage }) => (
            <FormaPagoSelect
              triggerId={resolvedId}
              value={field.value}
              onValueChange={field.onChange}
              placeholder={formCopy.paymentFormPlaceholder}
              disabled={!hasPendingBalance}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          )}
        </RHFCatalogField>

        <RHFTextField
          control={form.control}
          name="payment_time"
          label={formCopy.paymentTime}
          type="time"
          disabled={!hasPendingBalance}
          description={copy.hint.paymentTimeHint}
        />

        {installmentPreview != null ? (
          <p className="text-xs text-muted-foreground">
            {copy.chainRepair.previewInstallment(installmentPreview)}
          </p>
        ) : null}

        {lateRegistrationHint ? (
          <p className="text-xs text-warning">{lateRegistrationHint}</p>
        ) : null}

        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {formCopy.additionalData}
          </p>
          <RHFTextField
            control={form.control}
            name="reference"
            label={formCopy.reference}
            placeholder={formCopy.referencePlaceholder}
            disabled={!hasPendingBalance}
          />
          <RHFTextField
            control={form.control}
            name="notes"
            label={formCopy.notes}
            placeholder={formCopy.notesPlaceholder}
            disabled={!hasPendingBalance}
          />
        </div>

        {showValidationSummary && validationMessages.length > 0 ? (
          <FormValidationSummary
            title={formCopy.validationSummaryTitle}
            messages={validationMessages}
          />
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {formCopy.cancel}
          </Button>
          <Button type="submit" disabled={isPending || !hasPendingBalance}>
            {isPending ? formCopy.submitting : formCopy.submit}
          </Button>
        </DialogFooter>
      </form>

      <RepChainRepairConfirmDialog
        open={chainRepairOpen}
        onOpenChange={setChainRepairOpen}
        isPending={isPending}
        onConfirm={() => {
          if (!pendingPayload) return;
          clearOverlayError();
          mutate({ ...pendingPayload, confirmChainRepair: true });
        }}
      />
    </>
  );
}

export function PaymentFormDialog({ invoice, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <PaymentFormDialogInner
            key={invoice.id}
            invoice={invoice}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
