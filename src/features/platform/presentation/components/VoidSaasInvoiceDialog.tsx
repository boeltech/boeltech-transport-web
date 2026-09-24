import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
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

interface VoidSaasInvoiceDialogProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidSaasInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: VoidSaasInvoiceDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description}
            {invoice ? (
              <>
                {" "}
                ({formatBillingPeriodKey(invoice.periodKey)} ·{" "}
                {formatBillingPriceCents(invoice.totalCents)})
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {apiError ? (
          <AlertWithIcon variant="destructive" title={copy.error}>
            {apiError}
          </AlertWithIcon>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          {summaryErrors.length > 0 ? (
            <FormValidationSummary messages={summaryErrors} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="voidReason">{copy.reason}</Label>
            <Textarea
              id="voidReason"
              rows={3}
              {...form.register("voidReason")}
              {...getRegisterFieldErrorProps("voidReason", voidReasonError)}
            />
            <FieldInlineError fieldId="voidReason" message={voidReasonError} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!invoice}
              isLoading={voidMutation.isPending}
            >
              {voidMutation.isPending ? copy.cancelling : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
