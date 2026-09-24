/**
 * Sheet — Registrar cobro en efectivo (ADR-0096 F6).
 * Solo viajes `sin_cfdi_efectivo`. PATCH `/trips/:id/operational-cash`.
 */

import { useEffect } from "react";
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
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { usePatchTripOperationalCash } from "@features/trips/application";
import { useToast } from "@shared/hooks";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";

const cashCopy = cfdiEmissionIntentCopy.cash;

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";
const SHEET_HEADER_CLASS = "shrink-0";
const SHEET_BODY_CLASS = "min-h-0 flex-1 space-y-4 overflow-y-auto py-2";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2";

const operationalCashFormSchema = z.object({
  amount: z
    .number({ error: cashCopy.validation.amountRequired })
    .positive(cashCopy.validation.amountPositive),
  collectedAtLocal: z
    .string()
    .min(1, cashCopy.validation.collectedAtRequired),
  note: z
    .string()
    .max(250, cashCopy.validation.noteMax)
    .optional()
    .or(z.literal("")),
});

type OperationalCashFormValues = z.infer<typeof operationalCashFormSchema>;

export interface RegisterOperationalCashSheetProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default monto = tarifa base del viaje. */
  defaultAmount: number;
}

function defaultCollectedAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function RegisterOperationalCashSheetBody({
  tripId,
  onOpenChange,
  defaultAmount,
}: Omit<RegisterOperationalCashSheetProps, "open">) {
  const { toast } = useToast();
  const form = useForm<OperationalCashFormValues>({
    resolver: zodResolver(
      operationalCashFormSchema,
    ) as Resolver<OperationalCashFormValues>,
    defaultValues: {
      amount: defaultAmount > 0 ? defaultAmount : undefined,
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
      amount: defaultAmount > 0 ? defaultAmount : undefined,
      collectedAtLocal: defaultCollectedAtLocal(),
      note: "",
    });
  }, [defaultAmount, reset]);

  const mutation = usePatchTripOperationalCash(tripId, {
    onSuccess: () => {
      toast({ title: cashCopy.toast.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: cashCopy.toast.error,
        description: error.message,
        variant: "error",
      });
    },
  });

  const amount = watch("amount");
  const collectedAtLocal = watch("collectedAtLocal");
  const amountError = errors.amount?.message;
  const collectedAtError = errors.collectedAtLocal?.message;

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
          disabled={mutation.isPending}
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
  defaultAmount,
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
            key={`${tripId}-${defaultAmount}`}
            tripId={tripId}
            onOpenChange={onOpenChange}
            defaultAmount={defaultAmount}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
