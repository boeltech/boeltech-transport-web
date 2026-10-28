import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { mapBackendError } from "@shared/utils/errorMapper";
import type {
  PlatformPlanChangePreview,
  PlatformTenantListItem,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";
import {
  useAssignPlatformTenantPlan,
  usePlatformPlans,
} from "../../application/hooks/usePlatformTenants";
import {
  assignPlatformPlanSchema,
  type AssignPlatformPlanFormData,
} from "../validation";
import { opsCopy } from "./opsCopy";
import {
  formatCapacityMetric,
  formatPreviewPriceEstimate,
  previewWarningLabel,
} from "./previewFormatters";
import {
  OpsButton,
  OpsFieldError,
  OpsFormErrors,
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

interface OpsChangePlanSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill from Catálogo deep link. */
  initialPlanCode?: string | null;
}

export function OpsChangePlanSheet({
  tenant,
  open,
  onOpenChange,
  initialPlanCode = null,
}: OpsChangePlanSheetProps) {
  const copy = opsCopy.preview;
  const { toast } = useToast();
  const { data: plans = [], isLoading: plansLoading } = usePlatformPlans();
  const [preview, setPreview] = useState<PlatformPlanChangePreview | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const form = useForm<AssignPlatformPlanFormData>({
    resolver: zodResolver(assignPlatformPlanSchema),
    defaultValues: { planCode: "", reason: "" },
  });

  const planCode = form.watch("planCode");

  const assignMutation = useAssignPlatformTenantPlan({
    onSuccess: () => {
      toast({ title: copy.applySuccess, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.applyError,
        description: mapBackendError(error).message,
        variant: "error",
      });
    },
  });

  useEffect(() => {
    if (!open || !tenant) {
      if (!open) {
        form.reset({ planCode: "", reason: "" });
        setPreview(null);
        setPreviewError(null);
      }
      return;
    }
    form.reset({
      planCode: initialPlanCode?.trim() || "",
      reason: "",
    });
    setPreview(null);
    setPreviewError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate per open
  }, [open, tenant?.id, initialPlanCode]);

  useEffect(() => {
    if (!open || !tenant || !planCode) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    void platformApi
      .previewTenantPlan(tenant.id, planCode)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(mapBackendError(error).message);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tenant, planCode]);

  const activePlans = plans.filter((p) => p.isActive);
  const fieldErrors = collectFieldErrorMessages(form.formState.errors);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return;
    await assignMutation.mutateAsync({
      tenantId: tenant.id,
      payload: { planCode: values.planCode, reason: values.reason },
    });
  });

  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="overflow-y-auto sm:max-w-lg"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-change-plan-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.changePlanTitle}</OpsSheetTitle>
          <OpsSheetDescription>
            {copy.changePlanDescription}
            {tenant ? ` · ${tenant.name}` : null}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
          <OpsFormErrors messages={fieldErrors} />

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-plan-code">{copy.planLabel}</OpsLabel>
            <OpsSelect
              value={planCode || undefined}
              onValueChange={(value) =>
                form.setValue("planCode", value, { shouldValidate: true })
              }
              disabled={plansLoading || assignMutation.isPending}
            >
              <OpsSelectTrigger
                id="ops-plan-code"
                error={Boolean(form.formState.errors.planCode)}
                aria-invalid={Boolean(form.formState.errors.planCode)}
              >
                <OpsSelectValue placeholder={copy.planLabel} />
              </OpsSelectTrigger>
              <OpsSelectContent>
                {activePlans.map((plan) => (
                  <OpsSelectItem key={plan.code} value={plan.code}>
                    {plan.name} ({plan.code})
                  </OpsSelectItem>
                ))}
              </OpsSelectContent>
            </OpsSelect>
            <OpsFieldError
              fieldId="ops-plan-code"
              message={form.formState.errors.planCode?.message}
            />
          </div>

          {previewLoading ? (
            <p className="text-xs ops-text-muted">{copy.loadingPreview}</p>
          ) : null}
          {previewError ? (
            <p className="text-xs ops-text-danger" role="alert">
              {copy.previewError}: {previewError}
            </p>
          ) : null}

          {preview ? (
            <div className="ops-preview space-y-3" data-testid="ops-plan-preview">
              <p>
                <span className="ops-text-muted">{copy.currentPlan}: </span>
                {preview.current.name}
              </p>
              <p>
                <span className="ops-text-muted">{copy.targetPlan}: </span>
                {preview.target.name}
              </p>
              <p className="font-medium">
                {formatPreviewPriceEstimate(preview.priceEstimate)}
              </p>
              <div>
                <p className="text-xs font-medium ops-text-muted">
                  {copy.modulesGained}
                </p>
                <p>
                  {preview.modulesGained.length
                    ? preview.modulesGained.join(", ")
                    : copy.none}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium ops-text-muted">
                  {copy.modulesLost}
                </p>
                <p>
                  {preview.modulesLost.length
                    ? preview.modulesLost.join(", ")
                    : copy.none}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium ops-text-muted">
                  {copy.capacity.title}
                </p>
                <ul className="space-y-0.5 text-xs">
                  <li>
                    {copy.capacity.maxUsers}:{" "}
                    {formatCapacityMetric(preview.capacityDelta.maxUsers)}
                  </li>
                  <li>
                    {copy.capacity.maxBranches}:{" "}
                    {formatCapacityMetric(preview.capacityDelta.maxBranches)}
                  </li>
                  <li>
                    {copy.capacity.includedStamps}:{" "}
                    {formatCapacityMetric(preview.capacityDelta.includedStamps)}
                  </li>
                  <li>
                    {copy.capacity.stampsPerMotriz}:{" "}
                    {formatCapacityMetric(preview.capacityDelta.stampsPerMotriz)}
                  </li>
                </ul>
              </div>
              {preview.warnings.length > 0 ? (
                <ul className="space-y-1 text-xs ops-text-warn">
                  {preview.warnings.map((w) => (
                    <li key={w}>{previewWarningLabel(w)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-plan-reason">{copy.reasonLabel}</OpsLabel>
            <OpsTextarea
              id="ops-plan-reason"
              rows={3}
              placeholder={copy.reasonPlaceholder}
              disabled={assignMutation.isPending}
              {...form.register("reason")}
              {...getRegisterFieldErrorProps(
                "ops-plan-reason",
                form.formState.errors.reason?.message,
              )}
            />
            <OpsFieldError
              fieldId="ops-plan-reason"
              message={form.formState.errors.reason?.message}
            />
          </div>

          <OpsSheetFooter className="gap-2 sm:justify-end">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton
              type="submit"
              disabled={
                !preview ||
                previewLoading ||
                Boolean(previewError) ||
                assignMutation.isPending
              }
            >
              {copy.apply}
            </OpsButton>
          </OpsSheetFooter>
        </form>
      </OpsSheetContent>
    </OpsSheet>
  );
}
