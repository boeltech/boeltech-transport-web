import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import {
  PlatformTenantStatus,
  SUSPEND_REASON_CODES,
  type PlatformTenantStatusType,
  type SuspendReasonCodeType,
} from "../../domain/entities";
import { useUpdatePlatformTenantStatus } from "../../application/hooks/usePlatformTenants";
import {
  matchesTypedTenantConfirmation,
  suspendPlatformTenantSchema,
  typedSuspendPlatformTenantSchema,
  type SuspendPlatformTenantFormData,
  type TypedSuspendPlatformTenantFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
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
  OpsInput,
  OpsLabel,
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
  OpsTextarea,
} from "./ui";

export interface OpsSuspendTenantTarget {
  id: string;
  name: string;
  subdomain: string;
}

interface OpsSuspendTenantDialogProps {
  tenant: OpsSuspendTenantTarget | null;
  targetStatus: PlatformTenantStatusType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urgePayment?: boolean;
  onRegisterPayment?: () => void;
}

function getDialogCopy(status: PlatformTenantStatusType) {
  if (status === PlatformTenantStatus.ACTIVE) {
    return {
      title: platformCopy.tenants.suspend.reactivateTitle,
      description: platformCopy.tenants.suspend.reactivateDescription,
      confirm: platformCopy.tenants.suspend.confirmReactivate,
    };
  }
  if (status === PlatformTenantStatus.CANCELLED) {
    return {
      title: platformCopy.tenants.suspend.cancelTitle,
      description: platformCopy.tenants.suspend.cancelDescription,
      confirm: platformCopy.tenants.suspend.confirmCancel,
    };
  }
  return {
    title: platformCopy.tenants.suspend.suspendTitle,
    description: platformCopy.tenants.suspend.suspendDescription,
    confirm: platformCopy.tenants.suspend.confirmSuspend,
  };
}

/**
 * Suspend tipado + Reactivar — piel Ops (danger). Flujo idéntico a SuspendTenantDialog Conform.
 */
export function OpsSuspendTenantDialog({
  tenant,
  targetStatus,
  open,
  onOpenChange,
  urgePayment = false,
  onRegisterPayment,
}: OpsSuspendTenantDialogProps) {
  const { toast } = useToast();
  const copy = targetStatus ? getDialogCopy(targetStatus) : null;
  const suspendCopy = platformCopy.tenants.suspend;
  const isSuspend = targetStatus === PlatformTenantStatus.SUSPENDED;
  const [apiError, setApiError] = useState<string | null>(null);

  const updateMutation = useUpdatePlatformTenantStatus();

  const freeForm = useForm<SuspendPlatformTenantFormData>({
    resolver: zodResolver(suspendPlatformTenantSchema),
    defaultValues: { reason: "" },
  });

  const typedForm = useForm<TypedSuspendPlatformTenantFormData>({
    resolver: zodResolver(typedSuspendPlatformTenantSchema),
    defaultValues: {
      reasonCode: "past_due_policy",
      reasonDetail: "",
      confirmation: "",
    },
  });

  const reasonCode = typedForm.watch("reasonCode");
  const confirmationValue = typedForm.watch("confirmation");
  const confirmationMatches = tenant
    ? matchesTypedTenantConfirmation(confirmationValue ?? "", tenant)
    : false;

  useEffect(() => {
    if (!open) {
      setApiError(null);
      return;
    }
    setApiError(null);
    freeForm.reset({ reason: "" });
    typedForm.reset({
      reasonCode: "past_due_policy",
      reasonDetail: "",
      confirmation: "",
    });
  }, [open, freeForm, typedForm]);

  const onSubmitFree = freeForm.handleSubmit(async (values) => {
    if (!tenant || !targetStatus || isSuspend) return;
    setApiError(null);
    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        payload: {
          status: targetStatus,
          reason: values.reason?.trim() || undefined,
        },
      });
      toast({ title: suspendCopy.success, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        title: suspendCopy.error,
        description: message,
        variant: "error",
      });
    }
  });

  const onSubmitTyped = typedForm.handleSubmit(async (values) => {
    if (!tenant || !isSuspend) return;
    setApiError(null);

    if (!matchesTypedTenantConfirmation(values.confirmation, tenant)) {
      typedForm.setError("confirmation", {
        message: suspendCopy.confirmationMismatch,
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        payload: {
          status: PlatformTenantStatus.SUSPENDED,
          reasonCode: values.reasonCode as SuspendReasonCodeType,
          reasonDetail:
            values.reasonCode === "other"
              ? values.reasonDetail?.trim()
              : values.reasonDetail?.trim() || undefined,
        },
      });
      toast({ title: suspendCopy.success, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        title: suspendCopy.error,
        description: message,
        variant: "error",
      });
    }
  });

  const typedSummary = collectFieldErrorMessages(typedForm.formState.errors);
  const freeReasonError = freeForm.formState.errors.reason?.message;
  const confirmationError = typedForm.formState.errors.confirmation?.message;
  const reasonDetailError = typedForm.formState.errors.reasonDetail?.message;
  const reasonCodeError = typedForm.formState.errors.reasonCode?.message;
  const dialogTone =
    isSuspend || targetStatus === PlatformTenantStatus.CANCELLED
      ? "danger"
      : "default";

  return (
    <OpsDialog open={open} onOpenChange={onOpenChange}>
      <OpsDialogContent
        tone={dialogTone}
        className="sm:max-w-md"
        data-testid="ops-suspend-tenant-dialog"
      >
        <OpsDialogHeader>
          <OpsDialogTitle>{copy?.title}</OpsDialogTitle>
          <OpsDialogDescription>{copy?.description}</OpsDialogDescription>
        </OpsDialogHeader>

        {apiError ? (
          <OpsAlert tone="danger" title={suspendCopy.error}>
            {apiError}
          </OpsAlert>
        ) : null}

        {tenant ? (
          <OpsAlert>
            {tenant.name} ·{" "}
            <strong className="ops-font-mono">{tenant.subdomain}</strong>
          </OpsAlert>
        ) : null}

        {isSuspend ? (
          <form onSubmit={onSubmitTyped} className="space-y-4">
            <OpsAlert tone="danger">{suspendCopy.suspendImpact}</OpsAlert>

            <OpsFormErrors messages={typedSummary} />

            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-suspend-reason-code">
                {suspendCopy.reasonCodeLabel}
              </OpsLabel>
              <Controller
                control={typedForm.control}
                name="reasonCode"
                render={({ field }) => (
                  <OpsSelect value={field.value} onValueChange={field.onChange}>
                    <OpsSelectTrigger
                      id="ops-suspend-reason-code"
                      error={Boolean(reasonCodeError)}
                      aria-invalid={Boolean(reasonCodeError)}
                    >
                      <OpsSelectValue />
                    </OpsSelectTrigger>
                    <OpsSelectContent>
                      {SUSPEND_REASON_CODES.map((code) => (
                        <OpsSelectItem key={code} value={code}>
                          {suspendCopy.reasonCodes[code]}
                        </OpsSelectItem>
                      ))}
                    </OpsSelectContent>
                  </OpsSelect>
                )}
              />
              <OpsFieldError
                fieldId="ops-suspend-reason-code"
                message={reasonCodeError}
              />
            </div>

            {reasonCode === "other" ? (
              <div className="space-y-1.5">
                <OpsLabel htmlFor="ops-suspend-reason-detail">
                  {suspendCopy.reasonDetailLabel} *
                </OpsLabel>
                <OpsTextarea
                  id="ops-suspend-reason-detail"
                  rows={3}
                  placeholder={suspendCopy.reasonDetailPlaceholder}
                  {...typedForm.register("reasonDetail")}
                  {...getRegisterFieldErrorProps(
                    "ops-suspend-reason-detail",
                    reasonDetailError,
                  )}
                />
                <OpsFieldError
                  fieldId="ops-suspend-reason-detail"
                  message={reasonDetailError}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-suspend-confirmation">
                {suspendCopy.confirmationLabel}
              </OpsLabel>
              {tenant ? (
                <p className="text-xs ops-text-muted">
                  {suspendCopy.confirmationHint(tenant.subdomain, tenant.name)}
                </p>
              ) : null}
              <OpsInput
                id="ops-suspend-confirmation"
                autoComplete="off"
                {...typedForm.register("confirmation")}
                {...getRegisterFieldErrorProps(
                  "ops-suspend-confirmation",
                  confirmationError,
                )}
              />
              <OpsFieldError
                fieldId="ops-suspend-confirmation"
                message={confirmationError}
              />
            </div>

            <OpsDialogFooter>
              <OpsButton
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {suspendCopy.cancel}
              </OpsButton>
              <OpsButton
                type="submit"
                variant="danger"
                disabled={updateMutation.isPending || !confirmationMatches}
                data-ops-tick={confirmationMatches ? "danger" : undefined}
              >
                {copy?.confirm}
              </OpsButton>
            </OpsDialogFooter>
          </form>
        ) : (
          <form onSubmit={onSubmitFree} className="space-y-4">
            {urgePayment && onRegisterPayment ? (
              <OpsAlert>
                <p className="mb-2">{suspendCopy.reactivatePastDueHint}</p>
                <OpsButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onOpenChange(false);
                    onRegisterPayment();
                  }}
                >
                  {suspendCopy.reactivateRegisterPayment}
                </OpsButton>
              </OpsAlert>
            ) : null}

            <div className="space-y-1.5">
              <OpsLabel htmlFor="ops-reactivate-reason">
                {suspendCopy.reasonLabel}
              </OpsLabel>
              <OpsTextarea
                id="ops-reactivate-reason"
                rows={3}
                placeholder={suspendCopy.reasonPlaceholder}
                {...freeForm.register("reason")}
                {...getRegisterFieldErrorProps(
                  "ops-reactivate-reason",
                  freeReasonError,
                )}
              />
              <OpsFieldError
                fieldId="ops-reactivate-reason"
                message={freeReasonError}
              />
            </div>

            <OpsDialogFooter>
              <OpsButton
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {suspendCopy.cancel}
              </OpsButton>
              <OpsButton
                type="submit"
                variant={
                  targetStatus === PlatformTenantStatus.ACTIVE
                    ? "primary"
                    : "danger"
                }
                disabled={updateMutation.isPending}
              >
                {copy?.confirm}
              </OpsButton>
            </OpsDialogFooter>
          </form>
        )}
      </OpsDialogContent>
    </OpsDialog>
  );
}
