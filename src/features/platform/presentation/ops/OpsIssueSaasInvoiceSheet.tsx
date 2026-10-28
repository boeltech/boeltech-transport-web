import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
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
import {
  OpsAlert,
  OpsButton,
  OpsFieldError,
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

interface OpsIssueSaasInvoiceSheetProps {
  tenantId: string;
  tenantLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriodKey?: string;
}

export function OpsIssueSaasInvoiceSheet({
  tenantId,
  tenantLabel,
  open,
  onOpenChange,
  defaultPeriodKey,
}: OpsIssueSaasInvoiceSheetProps) {
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
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-issue-invoice-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.title}</OpsSheetTitle>
          <OpsSheetDescription>
            {tenantLabel
              ? `${copy.description} · ${tenantLabel}`
              : copy.description}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <OpsFormErrors messages={summaryErrors} />

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-periodKey">{copy.periodKey}</OpsLabel>
            <OpsInput
              id="ops-periodKey"
              placeholder={copy.periodPlaceholder}
              {...form.register("periodKey")}
              {...getRegisterFieldErrorProps(
                "ops-periodKey",
                form.formState.errors.periodKey?.message,
              )}
            />
            <OpsFieldError
              fieldId="ops-periodKey"
              message={form.formState.errors.periodKey?.message}
            />
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-issue-status">{copy.initialStatus}</OpsLabel>
            <OpsSelect
              value={status}
              onValueChange={(value) => {
                form.setValue("status", value as "draft" | "open", {
                  shouldValidate: true,
                });
              }}
            >
              <OpsSelectTrigger id="ops-issue-status">
                <OpsSelectValue />
              </OpsSelectTrigger>
              <OpsSelectContent>
                <OpsSelectItem value="open">{copy.statusOpen}</OpsSelectItem>
                <OpsSelectItem value="draft">{copy.statusDraft}</OpsSelectItem>
              </OpsSelectContent>
            </OpsSelect>
            {isDraft ? (
              <p className="text-xs ops-text-muted">{copy.statusDraftHint}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-dueDays">{copy.dueDays}</OpsLabel>
            <OpsInput
              id="ops-dueDays"
              type="number"
              min={1}
              max={90}
              {...form.register("dueDays")}
            />
          </div>

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-issueNotes">{copy.notes}</OpsLabel>
            <OpsTextarea
              id="ops-issueNotes"
              rows={3}
              {...form.register("notes")}
            />
          </div>

          <div className="ops-preview space-y-2" data-testid="ops-issue-preview">
            <p className="font-medium">{copy.preview}</p>
            {isValidBillingPeriodKey(periodKey) && !periodIsClosed ? (
              <OpsAlert tone="warn" title={copy.periodKeyClosedOnly} />
            ) : previewLoading ? (
              <p className="ops-text-muted">{copy.previewLoading}</p>
            ) : preview ? (
              <dl className="space-y-1">
                <div className="flex justify-between gap-2 text-base font-semibold">
                  <dt>{copy.total}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.totalCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 text-xs ops-text-muted">
                  <dt>{copy.subtotal}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.subtotalCents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 text-xs ops-text-muted">
                  <dt>{copy.iva}</dt>
                  <dd className="tabular-nums">
                    {formatBillingPriceCents(preview.ivaCents)}
                  </dd>
                </div>
              </dl>
            ) : periodIsClosed ? (
              <OpsAlert tone="warn" title={copy.previewEmpty} />
            ) : (
              <p className="ops-text-muted text-xs">{copy.previewHint}</p>
            )}
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
              disabled={!periodIsClosed || issueMutation.isPending}
            >
              {issueMutation.isPending
                ? isDraft
                  ? copy.submittingDraft
                  : copy.submitting
                : isDraft
                  ? copy.submitDraft
                  : copy.submit}
            </OpsButton>
          </OpsSheetFooter>
        </form>
      </OpsSheetContent>
    </OpsSheet>
  );
}
