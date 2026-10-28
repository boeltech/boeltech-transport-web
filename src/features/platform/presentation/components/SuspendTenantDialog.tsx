import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { Alert, AlertDescription, AlertWithIcon } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
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

export interface SuspendTenantTarget {
  id: string;
  name: string;
  subdomain: string;
}

interface SuspendTenantDialogProps {
  tenant: SuspendTenantTarget | null;
  targetStatus: PlatformTenantStatusType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reactivate: empujar Registrar pago si hay past due / saldo. */
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

export function SuspendTenantDialog({
  tenant,
  targetStatus,
  open,
  onOpenChange,
  urgePayment = false,
  onRegisterPayment,
}: SuspendTenantDialogProps) {
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
      toast({
        title: suspendCopy.success,
        variant: "success",
      });
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
      toast({
        title: suspendCopy.success,
        variant: "success",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>

        {apiError ? (
          <AlertWithIcon variant="destructive" title={suspendCopy.error}>
            {apiError}
          </AlertWithIcon>
        ) : null}

        {tenant ? (
          <Alert>
            <AlertDescription>
              {tenant.name} ·{" "}
              <strong className="font-mono">{tenant.subdomain}</strong>
            </AlertDescription>
          </Alert>
        ) : null}

        {isSuspend ? (
          <form onSubmit={onSubmitTyped} className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{suspendCopy.suspendImpact}</AlertDescription>
            </Alert>

            {typedSummary.length > 0 ? (
              <FormValidationSummary messages={typedSummary} />
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="suspend-reason-code">
                {suspendCopy.reasonCodeLabel}
              </Label>
              <Controller
                control={typedForm.control}
                name="reasonCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="suspend-reason-code"
                      aria-invalid={Boolean(reasonCodeError)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUSPEND_REASON_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {suspendCopy.reasonCodes[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldInlineError
                fieldId="suspend-reason-code"
                message={reasonCodeError}
              />
            </div>

            {reasonCode === "other" ? (
              <div className="space-y-2">
                <Label htmlFor="suspend-reason-detail">
                  {suspendCopy.reasonDetailLabel} *
                </Label>
                <Textarea
                  id="suspend-reason-detail"
                  rows={3}
                  placeholder={suspendCopy.reasonDetailPlaceholder}
                  {...typedForm.register("reasonDetail")}
                  {...getRegisterFieldErrorProps(
                    "suspend-reason-detail",
                    reasonDetailError,
                  )}
                />
                <FieldInlineError
                  fieldId="suspend-reason-detail"
                  message={reasonDetailError}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="suspend-confirmation">
                {suspendCopy.confirmationLabel}
              </Label>
              {tenant ? (
                <p className="text-xs text-muted-foreground">
                  {suspendCopy.confirmationHint(tenant.subdomain, tenant.name)}
                </p>
              ) : null}
              <Input
                id="suspend-confirmation"
                autoComplete="off"
                {...typedForm.register("confirmation")}
                {...getRegisterFieldErrorProps(
                  "suspend-confirmation",
                  confirmationError,
                )}
              />
              <FieldInlineError
                fieldId="suspend-confirmation"
                message={confirmationError}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {suspendCopy.cancel}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={updateMutation.isPending}
              >
                {copy?.confirm}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={onSubmitFree} className="space-y-4">
            {urgePayment && onRegisterPayment ? (
              <Alert>
                <AlertDescription className="space-y-2">
                  <p>{suspendCopy.reactivatePastDueHint}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onOpenChange(false);
                      onRegisterPayment();
                    }}
                  >
                    {suspendCopy.reactivateRegisterPayment}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="reason">{suspendCopy.reasonLabel}</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder={suspendCopy.reasonPlaceholder}
                {...freeForm.register("reason")}
                {...getRegisterFieldErrorProps("reason", freeReasonError)}
              />
              <FieldInlineError fieldId="reason" message={freeReasonError} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {suspendCopy.cancel}
              </Button>
              <Button
                type="submit"
                variant={
                  targetStatus === PlatformTenantStatus.ACTIVE
                    ? "default"
                    : "destructive"
                }
                isLoading={updateMutation.isPending}
              >
                {copy?.confirm}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
