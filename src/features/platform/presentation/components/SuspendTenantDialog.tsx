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
import { Alert, AlertDescription, AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  PlatformTenantStatus,
  type PlatformTenantListItem,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { useUpdatePlatformTenantStatus } from "../../application/hooks/usePlatformTenants";
import {
  suspendPlatformTenantSchema,
  type SuspendPlatformTenantFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";

interface SuspendTenantDialogProps {
  tenant: PlatformTenantListItem | null;
  targetStatus: PlatformTenantStatusType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: SuspendTenantDialogProps) {
  const { toast } = useToast();
  const copy = targetStatus ? getDialogCopy(targetStatus) : null;
  const [apiError, setApiError] = useState<string | null>(null);

  const updateMutation = useUpdatePlatformTenantStatus();

  const form = useForm<SuspendPlatformTenantFormData>({
    resolver: zodResolver(suspendPlatformTenantSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!open) {
      setApiError(null);
      return;
    }
    setApiError(null);
    form.reset({ reason: "" });
  }, [open, form]);

  const reasonError = form.formState.errors.reason?.message;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant || !targetStatus) return;
    setApiError(null);
    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        payload: {
          status: targetStatus,
          reason: values.reason,
        },
      });
      toast({
        title: platformCopy.tenants.suspend.success,
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        title: platformCopy.tenants.suspend.error,
        description: message,
        variant: "error",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>

        {apiError ? (
          <AlertWithIcon
            variant="destructive"
            title={platformCopy.tenants.suspend.error}
          >
            {apiError}
          </AlertWithIcon>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          {tenant ? (
            <Alert>
              <AlertDescription>
                {tenant.name} ·{" "}
                <strong className="font-mono">{tenant.subdomain}</strong>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reason">{platformCopy.tenants.suspend.reasonLabel}</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder={platformCopy.tenants.suspend.reasonPlaceholder}
              {...form.register("reason")}
              {...getRegisterFieldErrorProps("reason", reasonError)}
            />
            <FieldInlineError fieldId="reason" message={reasonError} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {platformCopy.tenants.suspend.cancel}
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
      </DialogContent>
    </Dialog>
  );
}
