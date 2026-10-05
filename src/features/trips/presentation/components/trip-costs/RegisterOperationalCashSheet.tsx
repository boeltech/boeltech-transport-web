/**
 * Sheet — Registrar abono de cobro operativo (ADR-0096 addendum F4).
 * Solo viajes `sin_cfdi_efectivo`. POST `/trips/:id/operational-cash-receipts`.
 */

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote } from "lucide-react";

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
  RHFTextareaField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";

import { useCreateOperationalCashReceipt } from "@features/trips/application";
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

function buildSchema(pendingAmount: number) {
  return z.object({
    amount: z
      .number({ error: cashCopy.validation.amountRequired })
      .positive(cashCopy.validation.amountPositive)
      .refine((value) => value <= pendingAmount + MXN_EPS, {
        message: cashCopy.validation.amountExceedsPending,
      }),
    collectedAtLocal: z
      .string()
      .min(1, cashCopy.validation.collectedAtRequired),
    note: z
      .string()
      .max(250, cashCopy.validation.noteMax)
      .optional()
      .or(z.literal("")),
  });
}

type OperationalCashFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface RegisterOperationalCashSheetProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default monto = saldo por cobrar (no tarifa completa si ya hay abonos). */
  pendingAmount: number;
}

function defaultCollectedAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function RegisterOperationalCashSheetBody({
  tripId,
  onOpenChange,
  pendingAmount,
}: Omit<RegisterOperationalCashSheetProps, "open">) {
  const { toast } = useToast();
  const schema = useMemo(() => buildSchema(pendingAmount), [pendingAmount]);
  const defaultAmount = pendingAmount > MXN_EPS ? pendingAmount : undefined;

  const form = useForm<OperationalCashFormValues>({
    resolver: zodResolver(schema) as Resolver<OperationalCashFormValues>,
    defaultValues: {
      amount: defaultAmount,
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
  } = form;

  useEffect(() => {
    reset({
      amount: pendingAmount > MXN_EPS ? pendingAmount : undefined,
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
  const collectedAtLocal = watch("collectedAtLocal");
  const amountError = errors.amount?.message;
  const collectedAtError = errors.collectedAtLocal?.message;

  const pendingLabel = formatMxCurrency(pendingAmount);
  const showPartialWarning =
    typeof amount === "number" &&
    amount > MXN_EPS &&
    amount + MXN_EPS < pendingAmount;
  const showExceedsWarning =
    typeof amount === "number" && amount > pendingAmount + MXN_EPS;

  const onValid = (values: OperationalCashFormValues) => {
    const note = values.note?.trim();
    mutation.mutate({
      amount: values.amount,
      collectedAt: localInputToUtcIso(values.collectedAtLocal),
      ...(note ? { note } : {}),
    });
  };

  const onInvalid = () => {
    // FormValidationSummary + FieldInlineError; sin toast de validación.
  };

  const summaryMessages = [
    amountError,
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
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
