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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFCatalogField,
  RHFMoneyField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
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

const schema = z.object({
  amount: z.coerce
    .number()
    .refine((n) => !Number.isNaN(n), { message: "Monto requerido" })
    .positive("El monto debe ser mayor a 0"),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato requerido: YYYY-MM-DD"),
  payment_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato HH:mm o HH:mm:ss")
    .optional()
    .default("12:00"),
  payment_form: z.string().min(1, "Forma de pago requerida"),
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
  const { balanceDue } = getInvoiceDisplayAmounts(invoice);
  const remainingBalance = Number(balanceDue.toFixed(2));
  const hasPendingBalance = remainingBalance > 0;
  const exchangeRate = invoice.exchangeRate ?? 1;

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
    if (invoice.paymentMethod !== "PPD" || !watchedPaymentDate) return null;
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
    invoice.paymentMethod,
    invoice.payments,
    invoice.total,
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
        title: "Sin saldo pendiente",
        description: "Esta factura ya no tiene saldo por cobrar.",
      });
      return;
    }

    if (values.amount > remainingBalance) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "El pago no puede exceder el saldo pendiente.",
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
    if (!watchedPaymentDate || invoice.paymentMethod !== "PPD") return null;
    const { status } = computeRepFiscalDeadline({
      paymentDate: watchedPaymentDate,
      repStatus: "pending",
      todayInMexico: getTodayMexicoDateString(),
    });
    if (status !== "overdue") return null;
    return copy.hint.paymentLateRegistrationHint;
  }, [watchedPaymentDate, invoice.paymentMethod]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {invoice.paymentMethod === "PPD"
            ? "Registrar pago (PPD / REP)"
            : "Registrar pago"}
        </DialogTitle>
      </DialogHeader>

      <div className="text-sm text-muted-foreground mb-2">
        Saldo pendiente:{" "}
        <span className="font-semibold text-foreground">
          {formatMxCurrency(balanceDue)}
        </span>
      </div>
      {!hasPendingBalance && (
        <p className="text-xs text-muted-foreground mb-2">
          Esta factura ya está liquidada; no se pueden registrar más pagos.
        </p>
      )}

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
            label="Monto"
            required
            disabled={!hasPendingBalance}
          />
          <RHFTextField
            control={form.control}
            name="payment_date"
            label="Fecha de pago"
            required
            type="date"
            disabled={!hasPendingBalance}
          />
          <RHFTextField
            control={form.control}
            name="payment_time"
            label="Hora de pago (opcional)"
            type="time"
            disabled={!hasPendingBalance}
            description={copy.hint.paymentTimeHint}
          />
        </div>

        {installmentPreview != null ? (
          <p className="text-xs text-muted-foreground">
            {copy.chainRepair.previewInstallment(installmentPreview)}
          </p>
        ) : null}

        {lateRegistrationHint ? (
          <p className="text-xs text-warning">
            {lateRegistrationHint}
          </p>
        ) : null}

        <RHFCatalogField control={form.control} name="payment_form" label="Forma de pago" required>
          {({ field, fieldState, resolvedId, errorMessage }) => (
            <FormaPagoSelect
              triggerId={resolvedId}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Selecciona forma de pago"
              disabled={!hasPendingBalance}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          )}
        </RHFCatalogField>

        <RHFTextField
          control={form.control}
          name="reference"
          label="Referencia (opcional)"
          placeholder="Número de transferencia, cheque..."
          disabled={!hasPendingBalance}
        />

        <RHFTextField
          control={form.control}
          name="notes"
          label="Notas (opcional)"
          placeholder="Notas adicionales"
          disabled={!hasPendingBalance}
        />

        {showValidationSummary && validationMessages.length > 0 ? (
          <FormValidationSummary
            title="Revisa los datos del pago"
            messages={validationMessages}
          />
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || !hasPendingBalance}>
            {isPending ? "Guardando..." : "Registrar pago"}
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
      <DialogContent className="sm:max-w-md">
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
