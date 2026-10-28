import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { useMarkSaasInvoicePaid } from "../../application/hooks/usePlatformSaasAr";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import {
  MARK_SAAS_INVOICE_PAID_METHODS,
  markSaasInvoicePaidSchema,
  type MarkSaasInvoicePaidFormData,
} from "../validation";
import {
  OpsButton,
  OpsFormErrors,
  OpsInput,
  OpsLabel,
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
  OpsTextarea,
} from "./ui";

interface OpsMarkSaasInvoicePaidSheetProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function defaultPaidAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export function OpsMarkSaasInvoicePaidSheet({
  invoice,
  open,
  onOpenChange,
}: OpsMarkSaasInvoicePaidSheetProps) {
  const copy = platformCopy.ar.markPaid;
  const { toast } = useToast();

  const form = useForm<MarkSaasInvoicePaidFormData>({
    resolver: zodResolver(markSaasInvoicePaidSchema),
    defaultValues: {
      paidAt: defaultPaidAtLocal(),
      method: "spei",
      reference: "",
      notes: "",
    },
  });

  const markMutation = useMarkSaasInvoicePaid({
    onSuccess: () => {
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.error,
        description: error.message,
        variant: "error",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      paidAt: defaultPaidAtLocal(),
      method: "spei",
      reference: "",
      notes: "",
    });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!invoice) return;
    await markMutation.mutateAsync({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      payload: {
        paidAt: localInputToUtcIso(values.paidAt),
        method: values.method,
        reference: values.reference?.trim() || null,
        notes: values.notes?.trim() || null,
      },
    });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);

  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-mark-paid-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.title}</OpsSheetTitle>
          <OpsSheetDescription>
            {copy.description}
            {invoice ? (
              <>
                {" "}
                · {formatBillingPeriodKey(invoice.periodKey)} ·{" "}
                {formatBillingPriceCents(invoice.totalCents)}
              </>
            ) : null}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <OpsFormErrors messages={summaryErrors} />

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-paidAt">{copy.paidAt}</OpsLabel>
            <OpsInput
              id="ops-paidAt"
              type="datetime-local"
              {...form.register("paidAt")}
              {...getRegisterFieldErrorProps(
                "ops-paidAt",
                form.formState.errors.paidAt?.message,
              )}
            />
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-pay-method">{copy.method}</OpsLabel>
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <OpsSelect value={field.value} onValueChange={field.onChange}>
                  <OpsSelectTrigger id="ops-pay-method">
                    <OpsSelectValue />
                  </OpsSelectTrigger>
                  <OpsSelectContent>
                    {MARK_SAAS_INVOICE_PAID_METHODS.map((key) => (
                      <OpsSelectItem key={key} value={key}>
                        {copy.methods[key]}
                      </OpsSelectItem>
                    ))}
                  </OpsSelectContent>
                </OpsSelect>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-payRef">{copy.reference}</OpsLabel>
            <OpsInput id="ops-payRef" {...form.register("reference")} />
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-payNotes">{copy.notes}</OpsLabel>
            <OpsTextarea id="ops-payNotes" rows={3} {...form.register("notes")} />
          </div>

          <OpsSheetFooter className="gap-2 sm:justify-end">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton
              type="submit"
              disabled={!invoice || markMutation.isPending}
            >
              {markMutation.isPending ? copy.submitting : copy.submit}
            </OpsButton>
          </OpsSheetFooter>
        </form>
      </OpsSheetContent>
    </OpsSheet>
  );
}
