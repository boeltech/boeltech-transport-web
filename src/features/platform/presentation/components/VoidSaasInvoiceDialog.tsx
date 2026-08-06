import { useEffect } from "react";
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
import { useToast } from "@shared/hooks";
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

  const form = useForm<VoidSaasInvoiceFormData>({
    resolver: zodResolver(voidSaasInvoiceSchema),
    defaultValues: { voidReason: "" },
  });

  const voidMutation = useVoidSaasInvoice({
    onSuccess: () => {
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ voidReason: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!invoice) return;
    await voidMutation.mutateAsync({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      payload: { voidReason: values.voidReason?.trim() || null },
    });
  });

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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voidReason">{copy.reason}</Label>
            <Textarea id="voidReason" rows={3} {...form.register("voidReason")} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={voidMutation.isPending || !invoice}
            >
              {voidMutation.isPending ? copy.cancelling : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
