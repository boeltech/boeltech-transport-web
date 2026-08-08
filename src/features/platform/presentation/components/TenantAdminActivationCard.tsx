import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AdminActivationStatus,
  type AdminActivationStatusType,
  type PlatformAdminActivation,
} from "../../domain/entities";
import { useResendPlatformTenantActivation } from "../../application/hooks/usePlatformTenants";
import { AdminActivationStatusBadge } from "../config/adminActivationStatusConfig";
import { platformCopy } from "../copy/platformCopy";
import { RotateAdminCredentialsDialog } from "./RotateAdminCredentialsDialog";

interface TenantAdminActivationCardProps {
  tenantId: string;
  activation: PlatformAdminActivation | null;
  canMutate: boolean;
}

const MUTABLE_STATUSES: ReadonlySet<AdminActivationStatusType> = new Set([
  AdminActivationStatus.PENDING,
  AdminActivationStatus.EMAIL_FAILED,
  AdminActivationStatus.EXPIRED,
]);

export function TenantAdminActivationCard({
  tenantId,
  activation,
  canMutate,
}: TenantAdminActivationCardProps) {
  const { toast } = useToast();
  const copy = platformCopy.tenants.detail.adminActivation;
  const [rotateOpen, setRotateOpen] = useState(false);

  const status = activation?.status ?? AdminActivationStatus.NONE;
  const canActOnActivation = canMutate && MUTABLE_STATUSES.has(status);

  const resendMutation = useResendPlatformTenantActivation({
    onSuccess: () => {
      toast({
        title: copy.resendSuccess,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: copy.resendError,
        description: mapBackendError(error).message,
        variant: "error",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{copy.title}</CardTitle>
              <p className="text-muted-foreground text-sm">{copy.description}</p>
            </div>
            <AdminActivationStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {copy.statusHints[status] ?? copy.statusHints.none}
          </p>

          {activation ? (
            <div className="space-y-3">
              {activation.email ? (
                <InfoRow
                  variant="inline"
                  label={copy.fields.email}
                  value={activation.email}
                />
              ) : null}
              {activation.expiresAt ? (
                <InfoRow
                  variant="inline"
                  label={copy.fields.expiresAt}
                  value={formatDateTime(activation.expiresAt)}
                />
              ) : null}
              {activation.lastSentAt ? (
                <InfoRow
                  variant="inline"
                  label={copy.fields.lastSentAt}
                  value={formatDateTime(activation.lastSentAt)}
                />
              ) : null}
              {activation.sendAttempts > 0 ? (
                <InfoRow
                  variant="inline"
                  label={copy.fields.sendAttempts}
                  value={String(activation.sendAttempts)}
                />
              ) : null}
              {status === AdminActivationStatus.EMAIL_FAILED &&
              activation.lastSendError ? (
                <AlertWithIcon variant="warning" title={copy.fields.lastSendError}>
                  {activation.lastSendError}
                </AlertWithIcon>
              ) : null}
            </div>
          ) : null}

          {canActOnActivation ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate({ id: tenantId })}
              >
                {resendMutation.isPending ? copy.resending : copy.resend}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRotateOpen(true)}
              >
                {copy.rotate}
              </Button>
            </div>
          ) : null}

          {!canMutate && MUTABLE_STATUSES.has(status) ? (
            <p className="text-muted-foreground text-xs">{copy.readOnlyHint}</p>
          ) : null}
        </CardContent>
      </Card>

      <RotateAdminCredentialsDialog
        tenantId={tenantId}
        open={rotateOpen}
        onOpenChange={setRotateOpen}
      />
    </>
  );
}
