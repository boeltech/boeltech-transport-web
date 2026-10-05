/**
 * Sheet — Anular abono de cobro operativo (ADR-0096 addendum F4).
 * POST `/trips/:id/operational-cash-receipts/:receiptId/void`.
 */

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban } from "lucide-react";

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
  FormValidationSummary,
  RHFTextareaField,
} from "@shared/ui/form";
import { InfoRow } from "@shared/ui/data-display";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";

import { useVoidOperationalCashReceipt } from "@features/trips/application";
import type { OperationalCashReceipt } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import { operationalCashErrorToast } from "../../utils/operationalCashUi";
import { formatMxCurrency } from "../trip-financial/financialSummary";

const cashCopy = cfdiEmissionIntentCopy.cash;

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";
const SHEET_HEADER_CLASS = "shrink-0";
const SHEET_BODY_CLASS = "min-h-0 flex-1 space-y-4 overflow-y-auto py-2";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2";

const voidFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, cashCopy.validation.voidReasonRequired)
    .max(250, cashCopy.validation.voidReasonMax),
});

type VoidFormValues = z.infer<typeof voidFormSchema>;

export interface VoidOperationalCashReceiptSheetProps {
  tripId: string;
  receipt: OperationalCashReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VoidOperationalCashReceiptSheetBody({
  tripId,
  receipt,
  onOpenChange,
}: {
  tripId: string;
  receipt: OperationalCashReceipt;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const form = useForm<VoidFormValues>({
    resolver: zodResolver(voidFormSchema) as Resolver<VoidFormValues>,
    defaultValues: { reason: "" },
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
  } = form;

  useEffect(() => {
    reset({ reason: "" });
  }, [receipt.id, reset]);

  const mutation = useVoidOperationalCashReceipt(tripId, {
    onSuccess: () => {
      toast({ title: cashCopy.toast.voidSuccess, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      const payload = operationalCashErrorToast(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { message: error.message },
        "void",
      );
      toast({
        title: payload.title,
        description: payload.description,
        variant: "error",
      });
    },
  });

  const onValid = (values: VoidFormValues) => {
    mutation.mutate({
      receiptId: receipt.id,
      reason: values.reason.trim(),
    });
  };

  const summaryMessages = [errors.reason?.message].filter(
    (m): m is string => Boolean(m),
  );

  return (
    <>
      <form
        id="void-operational-cash-form"
        className={SHEET_BODY_CLASS}
        onSubmit={handleSubmit(onValid)}
        noValidate
      >
        <InfoRow
          variant="inline"
          label={cashCopy.voidSheet.amountLabel}
          value={formatMxCurrency(receipt.amount)}
        />

        <RHFTextareaField
          control={form.control}
          name="reason"
          label={cashCopy.voidSheet.reason}
          placeholder={cashCopy.voidSheet.reasonPlaceholder}
          disabled={mutation.isPending}
          required
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
          {cashCopy.voidSheet.cancel}
        </Button>
        <Button
          type="submit"
          form="void-operational-cash-form"
          variant="destructive"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? cashCopy.voidSheet.submitting
            : cashCopy.voidSheet.submit}
        </Button>
      </SheetFooter>
    </>
  );
}

export function VoidOperationalCashReceiptSheet({
  tripId,
  receipt,
  open,
  onOpenChange,
}: VoidOperationalCashReceiptSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={SHEET_CONTENT_CLASS}>
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle className="inline-flex items-center gap-2">
            <Ban className="h-5 w-5 shrink-0" />
            {cashCopy.voidSheet.title}
          </SheetTitle>
          <SheetDescription>{cashCopy.voidSheet.description}</SheetDescription>
        </SheetHeader>
        {open && receipt ? (
          <VoidOperationalCashReceiptSheetBody
            key={receipt.id}
            tripId={tripId}
            receipt={receipt}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
