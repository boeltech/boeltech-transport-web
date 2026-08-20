import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  RHFDateTimeField,
  FormValidationSummary,
} from "@shared/ui/form";
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
  markSaasInvoicePaidSchema,
  type MarkSaasInvoicePaidFormData,
} from "../validation";

interface MarkSaasInvoicePaidSheetProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function defaultPaidAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export function MarkSaasInvoicePaidSheet({
  invoice,
  open,
  onOpenChange,
}: MarkSaasInvoicePaidSheetProps) {
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
        variant: "destructive",
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>
            {copy.description}
            {invoice ? (
              <>
                {" "}
                · {formatBillingPeriodKey(invoice.periodKey)} ·{" "}
                {formatBillingPriceCents(invoice.totalCents)}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {summaryErrors.length > 0 ? (
            <FormValidationSummary messages={summaryErrors} />
          ) : null}

          <RHFDateTimeField
            control={form.control}
            name="paidAt"
            fieldId="paidAt"
            label={copy.paidAt}
            required
          />

          <div className="space-y-2">
            <Label>{copy.method}</Label>
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(copy.methods) as Array<
                        keyof typeof copy.methods
                      >
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {copy.methods[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payRef">{copy.reference}</Label>
            <Input id="payRef" {...form.register("reference")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payNotes">{copy.notes}</Label>
            <Textarea id="payNotes" rows={3} {...form.register("notes")} />
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={markMutation.isPending || !invoice}>
              {markMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
