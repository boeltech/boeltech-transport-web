import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  useIssueSaasInvoice,
  useTenantReconciliationPreview,
} from "../../application/hooks/usePlatformSaasAr";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";
import {
  getLastClosedMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isValidBillingPeriodKey,
} from "../utils/billingPeriod";
import {
  issueSaasInvoiceSchema,
  type IssueSaasInvoiceFormData,
} from "../validation";

interface IssueSaasInvoiceSheetProps {
  tenantId: string;
  tenantLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriodKey?: string;
}

export function IssueSaasInvoiceSheet({
  tenantId,
  tenantLabel,
  open,
  onOpenChange,
  defaultPeriodKey,
}: IssueSaasInvoiceSheetProps) {
  const copy = platformCopy.ar.issue;
  const { toast } = useToast();
  const resolvedDefault = useMemo(
    () => defaultPeriodKey?.trim() || getLastClosedMexicoCityPeriodKey(),
    [defaultPeriodKey],
  );

  const form = useForm<IssueSaasInvoiceFormData>({
    resolver: zodResolver(
      issueSaasInvoiceSchema,
    ) as Resolver<IssueSaasInvoiceFormData>,
    defaultValues: { periodKey: resolvedDefault, notes: "", dueDays: 14 },
  });

  const periodKey = form.watch("periodKey") ?? "";
  const periodIsClosed =
    isValidBillingPeriodKey(periodKey) &&
    isClosedBillingPeriodKey(periodKey);

  const { data: preview, isFetching: previewLoading } =
    useTenantReconciliationPreview(tenantId, periodKey, open && periodIsClosed);

  const issueMutation = useIssueSaasInvoice({
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
      periodKey: resolvedDefault,
      notes: "",
      dueDays: 14,
    });
  }, [open, resolvedDefault, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await issueMutation.mutateAsync({
      tenantId,
      payload: {
        periodKey: values.periodKey,
        status: "open",
        notes: values.notes?.trim() || null,
        dueDays: values.dueDays ?? 14,
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
            {tenantLabel
              ? `${copy.description} · ${tenantLabel}`
              : copy.description}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {summaryErrors.length > 0 ? (
            <FormValidationSummary messages={summaryErrors} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="periodKey">{copy.periodKey}</Label>
            <Input
              id="periodKey"
              placeholder="2026-07"
              {...form.register("periodKey")}
              {...getRegisterFieldErrorProps(
                "periodKey",
                form.formState.errors.periodKey?.message,
              )}
            />
            <FieldInlineError
              fieldId="periodKey"
              message={form.formState.errors.periodKey?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDays">{copy.dueDays}</Label>
            <Input
              id="dueDays"
              type="number"
              min={1}
              max={90}
              {...form.register("dueDays")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueNotes">{copy.notes}</Label>
            <Textarea id="issueNotes" rows={3} {...form.register("notes")} />
          </div>

          <div className="rounded-md border p-3 text-sm space-y-2">
            <p className="font-medium">{copy.preview}</p>
            {isValidBillingPeriodKey(periodKey) && !periodIsClosed ? (
              <AlertWithIcon
                variant="warning"
                title={copy.periodKeyClosedOnly}
              />
            ) : previewLoading ? (
              <p className="text-muted-foreground">{copy.previewLoading}</p>
            ) : preview ? (
              <dl className="space-y-1">
                <div className="flex justify-between gap-2 text-base font-semibold">
                  <dt>{copy.total}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.totalCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <dt>{copy.subtotal}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.subtotalCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <dt>{copy.iva}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.ivaCents)}
                  </dd>
                </div>
              </dl>
            ) : periodIsClosed ? (
              <AlertWithIcon variant="warning" title={copy.previewEmpty} />
            ) : (
              <p className="text-muted-foreground text-xs">{copy.previewHint}</p>
            )}
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={issueMutation.isPending || !periodIsClosed}
            >
              {issueMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
