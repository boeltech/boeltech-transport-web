/**
 * Sheet — Registrar abono de cobro sin factura (ADR-0096 + B2).
 * Instrumento, referencia y fecha no futura (paquete 0.51.0).
 */

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote } from "lucide-react";
import {
  operationalReceiptReferenceRequired,
  type OperationalPaymentInstrument,
} from "@boeltech/cfdi-domain";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import {
  FormFieldShell,
  FormValidationSummary,
  MoneyInput,
  RHFSelect,
  RHFTextareaField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";

import { useCreateOperationalCashReceipt } from "@features/trips/application";
import { OPERATIONAL_PAYMENT_INSTRUMENT_LABELS } from "@features/finance/domain";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import { operationalCashErrorToast } from "../../utils/operationalCashUi";
import { formatMxCurrency } from "../trip-financial/financialSummary";

const cashCopy = cfdiEmissionIntentCopy.cash;
const MXN_EPS = 0.01;

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";
const SHEET_HEADER_CLASS = "shrink-0";
const SHEET_BODY_CLASS = "min-h-0 flex-1 space-y-4 overflow-y-auto py-2";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2";

const INSTRUMENT_OPTIONS = (
  Object.keys(OPERATIONAL_PAYMENT_INSTRUMENT_LABELS) as OperationalPaymentInstrument[]
).map((value) => ({
  value,
  label: OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[value],
}));

function buildSchema(pendingAmount: number) {
  return z
    .object({
      amount: z
        .number({ error: cashCopy.validation.amountRequired })
        .positive(cashCopy.validation.amountPositive)
        .refine((value) => value <= pendingAmount + MXN_EPS, {
          message: cashCopy.validation.amountExceedsPending,
        }),
      paymentInstrument: z.enum(["cash", "transfer", "check", "other"]),
      reference: z
        .string()
        .max(120, cashCopy.validation.referenceMax)
        .optional()
        .or(z.literal("")),
      collectedAtLocal: z
        .string()
        .min(1, cashCopy.validation.collectedAtRequired),
      note: z
        .string()
        .max(250, cashCopy.validation.noteMax)
        .optional()
        .or(z.literal("")),
    })
    .superRefine((values, ctx) => {
      const collectedIso = localInputToUtcIso(values.collectedAtLocal);
      if (new Date(collectedIso).getTime() > Date.now() + 5 * 60_000) {
        ctx.addIssue({
          code: "custom",
          path: ["collectedAtLocal"],
          message: cashCopy.validation.collectedAtFuture,
        });
      }
      if (operationalReceiptReferenceRequired(values.paymentInstrument)) {
        const ref = values.reference?.trim() ?? "";
        if (!ref) {
          ctx.addIssue({
            code: "custom",
            path: ["reference"],
            message:
              values.paymentInstrument === "check"
                ? cashCopy.validation.referenceRequiredCheck
                : cashCopy.validation.referenceRequiredTransfer,
          });
        }
      }
    });
}

type OperationalCashFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface RegisterOperationalCashSheetProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default monto = saldo por cobrar (no tarifa completa si ya hay abonos). */
  pendingAmount: number;
  /** Abre el Sheet del lote si el abono pertenece a uno (422). */
  onOpenBatch?: (batchId: string) => void;
}

function defaultCollectedAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function RegisterOperationalCashSheetBody({
  tripId,
  onOpenChange,
  pendingAmount,
  onOpenBatch,
}: Omit<RegisterOperationalCashSheetProps, "open">) {
  const { toast } = useToast();
  const schema = useMemo(() => buildSchema(pendingAmount), [pendingAmount]);
  const defaultAmount = pendingAmount > MXN_EPS ? pendingAmount : undefined;

  const form = useForm<OperationalCashFormValues>({
    resolver: zodResolver(schema) as Resolver<OperationalCashFormValues>,
    defaultValues: {
      amount: defaultAmount,
      paymentInstrument: "cash",
      reference: "",
      collectedAtLocal: defaultCollectedAtLocal(),
      note: "",
    },
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitted },
    setValue,
    watch,
    reset,
    setError,
  } = form;

  useEffect(() => {
    reset({
      amount: pendingAmount > MXN_EPS ? pendingAmount : undefined,
      paymentInstrument: "cash",
      reference: "",
      collectedAtLocal: defaultCollectedAtLocal(),
      note: "",
    });
  }, [pendingAmount, reset]);

  const mutation = useCreateOperationalCashReceipt(tripId, {
    onSuccess: () => {
      toast({ title: cashCopy.toast.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.code === "OPERATIONAL_RECEIPT_REFERENCE_REQUIRED") {
          setError("reference", {
            message: cashCopy.validation.referenceRequiredTransfer,
          });
          return;
        }
        if (error.code === "OPERATIONAL_RECEIPT_COLLECTED_AT_FUTURE") {
          setError("collectedAtLocal", {
            message: cashCopy.validation.collectedAtFuture,
          });
          return;
        }
        if (error.code === "TRIP_OPERATIONAL_CASH_RECEIPT_IN_BATCH") {
          const batchId = (
            error.details as { batch_id?: string } | undefined
          )?.batch_id;
          toast({
            title: cashCopy.toast.inBatch,
            variant: "error",
            action:
              batchId && onOpenBatch
                ? {
                    label: cashCopy.toast.viewBatchCta,
                    onClick: () => onOpenBatch(batchId),
                  }
                : undefined,
          });
          return;
        }
      }
      const payload = operationalCashErrorToast(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { message: error.message },
        "create",
      );
      toast({
        title: payload.title,
        description: payload.description,
        variant: "error",
      });
    },
  });

  const amount = watch("amount");
  const paymentInstrument = watch("paymentInstrument");
  const collectedAtLocal = watch("collectedAtLocal");
  const amountError = errors.amount?.message;
  const referenceError = errors.reference?.message;
  const collectedAtError = errors.collectedAtLocal?.message;
  const referenceRequired = operationalReceiptReferenceRequired(
    paymentInstrument ?? "cash",
  );

  const pendingLabel = formatMxCurrency(pendingAmount);
  const showPartialWarning =
    typeof amount === "number" &&
    amount > MXN_EPS &&
    amount + MXN_EPS < pendingAmount;
  const showExceedsWarning =
    typeof amount === "number" && amount > pendingAmount + MXN_EPS;

  const onValid = (values: OperationalCashFormValues) => {
    const note = values.note?.trim();
    const reference = values.reference?.trim();
    mutation.mutate({
      amount: values.amount,
      paymentInstrument: values.paymentInstrument,
      reference: reference || null,
      collectedAt: localInputToUtcIso(values.collectedAtLocal),
      ...(note ? { note } : {}),
    });
  };

  const onInvalid = () => {
    // FormValidationSummary + FieldInlineError; sin toast de validación.
  };

  const summaryMessages = [
    amountError,
    referenceError,
    collectedAtError,
    errors.note?.message,
  ].filter((m): m is string => Boolean(m));

  return (
    <>
      <form
        id="register-operational-cash-form"
        className={SHEET_BODY_CLASS}
        onSubmit={handleSubmit(onValid, onInvalid)}
        noValidate
      >
        <p className="text-sm text-muted-foreground">
          {cashCopy.sheet.pendingHint(pendingLabel)}
        </p>

        <FormFieldShell
          fieldId="operational-cash-amount"
          label={cashCopy.sheet.amount}
          required
          errorMessage={amountError}
        >
          <MoneyInput
            id="operational-cash-amount"
            value={amount}
            onValueChange={(value) =>
              setValue("amount", value as number, {
                shouldValidate: isSubmitted,
                shouldDirty: true,
              })
            }
            disabled={mutation.isPending}
            error={Boolean(amountError)}
            {...getFieldErrorAriaProps(
              "operational-cash-amount",
              amountError,
            )}
          />
        </FormFieldShell>

        {showExceedsWarning ? (
          <Alert variant="destructive">
            <AlertDescription>
              {cashCopy.sheet.warningExceeds(pendingLabel)}
            </AlertDescription>
          </Alert>
        ) : null}
        {showPartialWarning ? (
          <Alert variant="warning">
            <AlertDescription>
              {cashCopy.sheet.warningPartial(pendingLabel)}
            </AlertDescription>
          </Alert>
        ) : null}

        <FormFieldShell
          fieldId="operational-cash-instrument"
          label={cashCopy.sheet.paymentInstrument}
          required
          errorMessage={errors.paymentInstrument?.message}
        >
          <RHFSelect
            control={form.control}
            name="paymentInstrument"
            triggerId="operational-cash-instrument"
            options={INSTRUMENT_OPTIONS}
            allowNone={false}
            showFieldError={false}
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="operational-cash-reference"
          label={cashCopy.sheet.reference}
          required={referenceRequired}
          errorMessage={referenceError}
        >
          <Input
            id="operational-cash-reference"
            placeholder={
              cashCopy.sheet.referencePlaceholder[paymentInstrument ?? "cash"]
            }
            disabled={mutation.isPending}
            error={Boolean(referenceError)}
            {...form.register("reference")}
            {...getFieldErrorAriaProps(
              "operational-cash-reference",
              referenceError,
            )}
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="operational-cash-collected-at"
          label={cashCopy.sheet.collectedAt}
          required
          errorMessage={collectedAtError}
        >
          <Input
            id="operational-cash-collected-at"
            type="datetime-local"
            value={collectedAtLocal}
            onChange={(e) =>
              setValue("collectedAtLocal", e.target.value, {
                shouldValidate: isSubmitted,
                shouldDirty: true,
              })
            }
            disabled={mutation.isPending}
            error={Boolean(collectedAtError)}
            {...getFieldErrorAriaProps(
              "operational-cash-collected-at",
              collectedAtError,
            )}
          />
        </FormFieldShell>

        <RHFTextareaField
          control={form.control}
          name="note"
          label={cashCopy.sheet.note}
          placeholder={cashCopy.sheet.notePlaceholder}
          disabled={mutation.isPending}
          rows={3}
        />

        {isSubmitted && summaryMessages.length > 0 ? (
          <FormValidationSummary messages={summaryMessages} />
        ) : null}
      </form>

      <SheetFooter className={SHEET_FOOTER_CLASS}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          {cashCopy.sheet.cancel}
        </Button>
        <Button
          type="submit"
          form="register-operational-cash-form"
          disabled={mutation.isPending || pendingAmount <= MXN_EPS}
        >
          {mutation.isPending
            ? cashCopy.sheet.submitting
            : cashCopy.sheet.submit}
        </Button>
      </SheetFooter>
    </>
  );
}

export function RegisterOperationalCashSheet({
  tripId,
  open,
  onOpenChange,
  pendingAmount,
  onOpenBatch,
}: RegisterOperationalCashSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={SHEET_CONTENT_CLASS}>
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle className="inline-flex items-center gap-2">
            <Banknote className="h-5 w-5 shrink-0" />
            {cashCopy.sheet.title}
          </SheetTitle>
          <SheetDescription>{cashCopy.sheet.description}</SheetDescription>
        </SheetHeader>
        {open ? (
          <RegisterOperationalCashSheetBody
            key={`${tripId}-${pendingAmount}`}
            tripId={tripId}
            onOpenChange={onOpenChange}
            pendingAmount={pendingAmount}
            onOpenBatch={onOpenBatch}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
