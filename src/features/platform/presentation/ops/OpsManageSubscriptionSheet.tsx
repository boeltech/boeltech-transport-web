import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { mapBackendError } from "@shared/utils/errorMapper";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import type {
  PlatformSubscriptionUpsertPreview,
  PlatformTenantListItem,
} from "../../domain/entities";
import {
  usePlatformTenantSubscription,
  useUpsertPlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { usePlatformPlans } from "../../application/hooks/usePlatformTenants";
import { platformApi } from "../../infrastructure/platformApi";
import {
  managePlatformSubscriptionSchema,
  type ManagePlatformSubscriptionFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
import {
  formatPlanSelectLabel,
  resolvePlanDisplayName,
} from "../utils/formatPlanLabel";
import {
  isDeclaredFleetBand,
  recommendOperationalPlanCode,
} from "../utils/recommendOperationalPlan";
import { previewWarningLabel } from "./previewFormatters";
import {
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

interface OpsManageSubscriptionSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBSCRIPTION_STATUS_OPTIONS = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
] as const;

const BILLING_CYCLE_OPTIONS = ["monthly", "annual"] as const;

function defaultTrialEndsAtLocal(): string {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 14);
  return utcIsoToLocalInput(end.toISOString());
}

/** Manage subscription desde Hub flag ON — fork Ops (Conform intacta). */
export function OpsManageSubscriptionSheet({
  tenant,
  open,
  onOpenChange,
}: OpsManageSubscriptionSheetProps) {
  const { toast } = useToast();
  const { data: plans } = usePlatformPlans();
  const { data: subscription } = usePlatformTenantSubscription(tenant?.id ?? "");
  const [preview, setPreview] =
    useState<PlatformSubscriptionUpsertPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const upsertMutation = useUpsertPlatformTenantSubscription({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.manageSubscription.success,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: platformCopy.tenants.manageSubscription.error,
        description: error.message,
        variant: "error",
      });
    },
  });

  const form = useForm<ManagePlatformSubscriptionFormData>({
    resolver: zodResolver(managePlatformSubscriptionSchema),
    defaultValues: {
      planCode: tenant?.planCode ?? "",
      status: "active",
      billingCycle: "monthly",
      trialEndsAt: "",
      notes: "",
    },
  });

  const hydrateSessionRef = useRef<{
    tenantId: string;
    appliedSubscription: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open || !tenant) {
      if (!open) {
        hydrateSessionRef.current = null;
        setPreview(null);
        setPreviewError(null);
      }
      return;
    }

    const values: ManagePlatformSubscriptionFormData = {
      planCode: subscription?.planCode ?? tenant.planCode ?? "",
      status:
        (subscription?.status as ManagePlatformSubscriptionFormData["status"]) ??
        "active",
      billingCycle:
        (subscription?.billingCycle as ManagePlatformSubscriptionFormData["billingCycle"]) ??
        "monthly",
      trialEndsAt: subscription?.trialEndsAt
        ? utcIsoToLocalInput(subscription.trialEndsAt)
        : "",
      notes: subscription?.notes ?? "",
    };

    const session = hydrateSessionRef.current;
    const isNewSession = !session || session.tenantId !== tenant.id;
    if (isNewSession) {
      hydrateSessionRef.current = {
        tenantId: tenant.id,
        appliedSubscription: Boolean(subscription),
      };
      form.reset(values);
      return;
    }

    if (!session.appliedSubscription && subscription) {
      session.appliedSubscription = true;
      form.reset(values);
    }
  }, [open, tenant, subscription, form]);

  const status = useWatch({ control: form.control, name: "status" });
  const planCode = useWatch({ control: form.control, name: "planCode" });
  const billingCycle = useWatch({ control: form.control, name: "billingCycle" });
  const trialEndsAt = useWatch({ control: form.control, name: "trialEndsAt" });
  const notes = useWatch({ control: form.control, name: "notes" });

  const shouldPreview = open && Boolean(tenant && planCode && status);

  useEffect(() => {
    if (!shouldPreview || !tenant || !planCode || !status) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    const trialIso =
      status === "trialing" && trialEndsAt
        ? localInputToUtcIso(trialEndsAt)
        : null;

    void platformApi
      .previewTenantSubscription(tenant.id, {
        planCode,
        status,
        billingCycle,
        trialEndsAt: trialIso,
        notes: notes?.trim() || null,
      })
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
  }, [
    shouldPreview,
    tenant,
    planCode,
    status,
    billingCycle,
    trialEndsAt,
    notes,
  ]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return;
    const trialEndsAtIso =
      values.status === "trialing" && values.trialEndsAt
        ? localInputToUtcIso(values.trialEndsAt)
        : null;
    await upsertMutation.mutateAsync({
      tenantId: tenant.id,
      payload: {
        planCode: values.planCode,
        status: values.status,
        billingCycle: values.billingCycle,
        trialEndsAt: trialEndsAtIso,
        notes: values.notes?.trim() || null,
      },
    });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const copy = platformCopy.tenants.manageSubscription;
  const createCopy = platformCopy.tenants.create;
  const statusLabels = platformCopy.tenants.detail.subscription.statusLabels;
  const cycleLabels = platformCopy.tenants.detail.subscription.cycleLabels;

  const fleetBand =
    tenant?.declaredFleetBand && isDeclaredFleetBand(tenant.declaredFleetBand)
      ? tenant.declaredFleetBand
      : null;
  const suggestedPlanCode = recommendOperationalPlanCode({ band: fleetBand });
  const suggestedPlanName = resolvePlanDisplayName(suggestedPlanCode, plans);

  const modulesToRevoke = preview?.modulesToRevoke ?? [];
  const showRevokePreview =
    Boolean(preview?.losesOperationalMotriz) || modulesToRevoke.length > 0;

  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="sm:max-w-lg overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-manage-subscription-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.title}</OpsSheetTitle>
          <OpsSheetDescription>{copy.description}</OpsSheetDescription>
        </OpsSheetHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-5" noValidate>
          <div className="space-y-3">
            <p className="text-sm font-medium">{copy.sectionPlan}</p>
            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-sub-planCode">{copy.fields.plan}</OpsLabel>
              <OpsSelect
                value={form.watch("planCode") || undefined}
                onValueChange={(value) =>
                  form.setValue("planCode", value, { shouldValidate: true })
                }
              >
                <OpsSelectTrigger
                  id="ops-sub-planCode"
                  {...getRegisterFieldErrorProps(
                    "ops-sub-planCode",
                    form.formState.errors.planCode?.message,
                  )}
                >
                  <OpsSelectValue placeholder={copy.placeholders.plan} />
                </OpsSelectTrigger>
                <OpsSelectContent>
                  {(plans ?? []).map((plan) => (
                    <OpsSelectItem key={plan.code} value={plan.code}>
                      {formatPlanSelectLabel(plan)}
                    </OpsSelectItem>
                  ))}
                </OpsSelectContent>
              </OpsSelect>
              <OpsFieldError
                fieldId="ops-sub-planCode"
                message={form.formState.errors.planCode?.message}
              />
              {fleetBand ? (
                <p className="text-xs ops-text-muted">
                  {copy.fleetHint(
                    createCopy.fleetBands[fleetBand],
                    suggestedPlanName,
                  )}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-sub-cycle">{copy.fields.cycle}</OpsLabel>
              <OpsSelect
                value={form.watch("billingCycle")}
                onValueChange={(value) =>
                  form.setValue(
                    "billingCycle",
                    value as ManagePlatformSubscriptionFormData["billingCycle"],
                    { shouldValidate: true },
                  )
                }
              >
                <OpsSelectTrigger id="ops-sub-cycle">
                  <OpsSelectValue />
                </OpsSelectTrigger>
                <OpsSelectContent>
                  {BILLING_CYCLE_OPTIONS.map((cycle) => (
                    <OpsSelectItem key={cycle} value={cycle}>
                      {cycleLabels[cycle]}
                    </OpsSelectItem>
                  ))}
                </OpsSelectContent>
              </OpsSelect>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{copy.sectionStatus}</p>
            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-sub-status">{copy.fields.status}</OpsLabel>
              <OpsSelect
                value={form.watch("status")}
                onValueChange={(value) => {
                  const next =
                    value as ManagePlatformSubscriptionFormData["status"];
                  form.setValue("status", next, { shouldValidate: true });
                  if (next === "trialing" && !form.getValues("trialEndsAt")) {
                    form.setValue("trialEndsAt", defaultTrialEndsAtLocal(), {
                      shouldValidate: false,
                    });
                  }
                }}
              >
                <OpsSelectTrigger id="ops-sub-status">
                  <OpsSelectValue />
                </OpsSelectTrigger>
                <OpsSelectContent>
                  {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
                    <OpsSelectItem key={option} value={option}>
                      {statusLabels[option]}
                    </OpsSelectItem>
                  ))}
                </OpsSelectContent>
              </OpsSelect>
              {status && copy.statusEffects[status] ? (
                <p className="text-xs ops-text-muted">
                  {copy.statusEffects[status]}
                </p>
              ) : null}
            </div>

            {status === "trialing" ? (
              <div className="space-y-1.5">
                <OpsLabel htmlFor="ops-sub-trial">{copy.fields.trial}</OpsLabel>
                <OpsInput
                  id="ops-sub-trial"
                  type="datetime-local"
                  {...form.register("trialEndsAt")}
                  {...getRegisterFieldErrorProps(
                    "ops-sub-trial",
                    form.formState.errors.trialEndsAt?.message,
                  )}
                />
                <OpsFieldError
                  fieldId="ops-sub-trial"
                  message={form.formState.errors.trialEndsAt?.message}
                />
              </div>
            ) : null}
          </div>

          {previewLoading ? (
            <p className="text-xs ops-text-muted" role="status">
              {copy.loadingPreview}
            </p>
          ) : null}
          {previewError ? (
            <p className="text-xs ops-text-danger" role="alert">
              {copy.previewError}: {previewError}
            </p>
          ) : null}
          {preview && (showRevokePreview || modulesToRevoke.length > 0) ? (
            <div
              className="space-y-2 rounded-md border ops-border p-3"
              data-testid="ops-subscription-revoke-preview"
            >
              <p className="text-xs font-medium ops-text-muted">
                {copy.modulesToRevoke}
              </p>
              <p className="text-sm ops-text">
                {modulesToRevoke.length
                  ? modulesToRevoke
                      .map((m) => m.moduleName || m.moduleCode)
                      .join(", ")
                  : copy.none}
              </p>
              {modulesToRevoke.length > 0 ? (
                <p className="text-xs ops-text-warn">{copy.periodBilledFull}</p>
              ) : null}
              {preview.warnings.filter(
                (w) => w !== "PERIOD_IN_PROGRESS_BILLED_FULL",
              ).length > 0 ? (
                <ul className="space-y-1 text-xs ops-text-warn">
                  {preview.warnings
                    .filter((w) => w !== "PERIOD_IN_PROGRESS_BILLED_FULL")
                    .map((w) => (
                      <li key={w}>{previewWarningLabel(w)}</li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-medium">{copy.sectionNotes}</p>
            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-sub-notes">{copy.fields.notes}</OpsLabel>
              <OpsTextarea
                id="ops-sub-notes"
                rows={3}
                placeholder={copy.placeholders.notes}
                {...form.register("notes")}
              />
              <p className="text-xs ops-text-muted">{copy.notesHint}</p>
              <OpsFieldError
                fieldId="ops-sub-notes"
                message={form.formState.errors.notes?.message}
              />
            </div>
          </div>

          <OpsFormErrors messages={summaryErrors} />

          <OpsSheetFooter className="gap-2 sm:justify-end">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? copy.submitting : copy.submit}
            </OpsButton>
          </OpsSheetFooter>
        </form>
      </OpsSheetContent>
    </OpsSheet>
  );
}
