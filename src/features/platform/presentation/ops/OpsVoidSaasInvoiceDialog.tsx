import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { useVoidSaasInvoice } from "../../application/hooks/usePlatformSaasAr";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import {
  voidSaasInvoiceSchema,
  type VoidSaasInvoiceFormData,
} from "../validation";
import {
  OpsAlert,
  OpsButton,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
  OpsFieldError,
  OpsFormErrors,
  OpsLabel,
  OpsTextarea,
} from "./ui";

interface OpsVoidSaasInvoiceDialogProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpsVoidSaasInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: OpsVoidSaasInvoiceDialogProps) {
  const copy = platformCopy.ar.void;
  const { toast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<VoidSaasInvoiceFormData>({
    resolver: zodResolver(voidSaasInvoiceSchema),
    defaultValues: { voidReason: "" },
  });

  const voidMutation = useVoidSaasInvoice();

  useEffect(() => {
    if (!open) {
      setApiError(null);
      return;
    }
    setApiError(null);
    form.reset({ voidReason: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!invoice) return;
    setApiError(null);
    try {
      await voidMutation.mutateAsync({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        payload: { voidReason: values.voidReason?.trim() || null },
      });
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        title: copy.error,
        description: message,
        variant: "error",
      });
    }
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const voidReasonError = form.formState.errors.voidReason?.message;

  return (
    <OpsDialog open={open} onOpenChange={onOpenChange}>
      <OpsDialogContent tone="danger" data-testid="ops-void-invoice-dialog">
        <OpsDialogHeader>
          <OpsDialogTitle>{copy.title}</OpsDialogTitle>
          <OpsDialogDescription>
            {copy.description}
            {invoice ? (
              <>
                {" "}
                ({formatBillingPeriodKey(invoice.periodKey)} ·{" "}
                {formatBillingPriceCents(invoice.totalCents)})
              </>
            ) : null}
          </OpsDialogDescription>
        </OpsDialogHeader>

        {apiError ? (
          <OpsAlert tone="danger" title={copy.error}>
            {apiError}
          </OpsAlert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <OpsFormErrors messages={summaryErrors} />

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-voidReason">{copy.reason}</OpsLabel>
            <OpsTextarea
              id="ops-voidReason"
              rows={3}
              {...form.register("voidReason")}
              {...getRegisterFieldErrorProps("ops-voidReason", voidReasonError)}
            />
            <OpsFieldError fieldId="ops-voidReason" message={voidReasonError} />
          </div>

          <OpsDialogFooter>
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton
              type="submit"
              variant="danger"
              disabled={!invoice || voidMutation.isPending}
            >
              {voidMutation.isPending ? copy.cancelling : copy.confirm}
            </OpsButton>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
