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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
    defaultValues: {
      periodKey: resolvedDefault,
      status: "open",
      notes: "",
      dueDays: 14,
    },
  });

  const periodKey = form.watch("periodKey") ?? "";
  const status = form.watch("status") ?? "open";
  const periodIsClosed =
    isValidBillingPeriodKey(periodKey) &&
    isClosedBillingPeriodKey(periodKey);

  const { data: preview, isFetching: previewLoading } =
    useTenantReconciliationPreview(tenantId, periodKey, open && periodIsClosed);

  const issueMutation = useIssueSaasInvoice({
    onSuccess: (_result, variables) => {
      const asDraft = variables.payload.status === "draft";
      toast({
        title: asDraft ? copy.successDraft : copy.success,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error, variables) => {
      const asDraft = variables.payload.status === "draft";
      toast({
        title: asDraft ? copy.errorDraft : copy.error,
        description: error.message,
        variant: "error",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      periodKey: resolvedDefault,
      status: "open",
      notes: "",
      dueDays: 14,
    });
  }, [open, resolvedDefault, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await issueMutation.mutateAsync({
      tenantId,
      payload: {
        periodKey: values.periodKey,
        status: values.status ?? "open",
        notes: values.notes?.trim() || null,
        dueDays: values.dueDays ?? 14,
      },
    });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const isDraft = status === "draft";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
      >
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
              placeholder={copy.periodPlaceholder}
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
            <Label htmlFor="issue-status">{copy.initialStatus}</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                form.setValue("status", value as "draft" | "open", {
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger id="issue-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{copy.statusOpen}</SelectItem>
                <SelectItem value="draft">{copy.statusDraft}</SelectItem>
              </SelectContent>
            </Select>
            {isDraft ? (
              <p className="text-xs text-muted-foreground">
                {copy.statusDraftHint}
              </p>
            ) : null}
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

          <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-2">
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
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              disabled={!periodIsClosed}
              isLoading={issueMutation.isPending}
            >
              {issueMutation.isPending
                ? isDraft
                  ? copy.submittingDraft
                  : copy.submitting
                : isDraft
                  ? copy.submitDraft
                  : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
