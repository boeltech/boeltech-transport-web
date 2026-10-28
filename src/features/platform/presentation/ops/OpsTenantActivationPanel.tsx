import { useState } from "react";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AdminActivationStatus,
  ADMIN_ACTIVATION_STATUS_LABELS,
  type AdminActivationStatusType,
  type PlatformAdminActivation,
} from "../../domain/entities";
import { useResendPlatformTenantActivation } from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";
import { OpsRotateAdminCredentialsDialog } from "./OpsRotateAdminCredentialsDialog";
import { activationStatusTone } from "./opsStatusTones";
import { OpsAlert } from "./ui/OpsAlert";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";

interface OpsTenantActivationPanelProps {
  tenantId: string;
  activation: PlatformAdminActivation | null;
  canMutate: boolean;
}

const MUTABLE_STATUSES: ReadonlySet<AdminActivationStatusType> = new Set([
  AdminActivationStatus.PENDING,
  AdminActivationStatus.EMAIL_FAILED,
  AdminActivationStatus.EXPIRED,
]);

const COMPACT_STATUSES: ReadonlySet<AdminActivationStatusType> = new Set([
  AdminActivationStatus.ACTIVATED,
  AdminActivationStatus.NONE,
]);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 ops-type-caption">
      <span className="ops-text-muted">{label}</span>
      <span className="ops-text">{value}</span>
    </div>
  );
}

export function OpsTenantActivationPanel({
  tenantId,
  activation,
  canMutate,
}: OpsTenantActivationPanelProps) {
  const { toast } = useToast();
  const copy = platformCopy.tenants.detail.adminActivation;
  const [rotateOpen, setRotateOpen] = useState(false);

  const status = activation?.status ?? AdminActivationStatus.NONE;
  const canActOnActivation = canMutate && MUTABLE_STATUSES.has(status);
  const isCompact = COMPACT_STATUSES.has(status);

  const resendMutation = useResendPlatformTenantActivation({
    onSuccess: () => {
      toast({ title: copy.resendSuccess, variant: "success" });
    },
    onError: (error) => {
      toast({
        title: copy.resendError,
        description: mapBackendError(error).message,
        variant: "error",
      });
    },
  });

  if (isCompact) {
    return (
      <div
        id="tenant-admin-activation"
        data-testid="ops-tenant-activation"
        className="ops-rounded ops-hairline ops-bg-surface flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
      >
        <span className="ops-type-caption font-medium ops-text">
          {copy.title}
        </span>
        <OpsBadge tone={activationStatusTone(status)}>
          {copy.statusLabels[status] ??
            ADMIN_ACTIVATION_STATUS_LABELS[status] ??
            status}
        </OpsBadge>
        <span className="ops-type-caption ops-text-muted">
          {copy.statusHints[status] ?? copy.statusHints.none}
        </span>
      </div>
    );
  }

  return (
    <>
      <OpsPanel id="tenant-admin-activation" data-testid="ops-tenant-activation">
        <OpsPanelHeader className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <OpsPanelTitle>{copy.title}</OpsPanelTitle>
            <OpsPanelDescription>{copy.description}</OpsPanelDescription>
          </div>
          <OpsBadge tone={activationStatusTone(status)}>
            {copy.statusLabels[status] ??
              ADMIN_ACTIVATION_STATUS_LABELS[status] ??
              status}
          </OpsBadge>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <p className="ops-type-caption ops-text-muted">
            {copy.statusHints[status] ?? copy.statusHints.none}
          </p>
          {activation ? (
            <div className="space-y-2">
              {activation.email ? (
                <Row label={copy.fields.email} value={activation.email} />
              ) : null}
              {activation.expiresAt ? (
                <Row
                  label={copy.fields.expiresAt}
                  value={formatDateTime(activation.expiresAt)}
                />
              ) : null}
              {activation.lastSentAt ? (
                <Row
                  label={copy.fields.lastSentAt}
                  value={formatDateTime(activation.lastSentAt)}
                />
              ) : null}
              {activation.sendAttempts > 0 ? (
                <Row
                  label={copy.fields.sendAttempts}
                  value={String(activation.sendAttempts)}
                />
              ) : null}
              {status === AdminActivationStatus.EMAIL_FAILED &&
              activation.lastSendError ? (
                <OpsAlert tone="warn" title={copy.fields.lastSendError}>
                  {activation.lastSendError}
                </OpsAlert>
              ) : null}
            </div>
          ) : null}

          {canActOnActivation ? (
            <div className="flex flex-wrap gap-2">
              <OpsButton
                variant="ghost"
                size="sm"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate({ id: tenantId })}
              >
                {resendMutation.isPending ? copy.resending : copy.resend}
              </OpsButton>
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={() => setRotateOpen(true)}
              >
                {copy.rotate}
              </OpsButton>
            </div>
          ) : null}

          {!canMutate && MUTABLE_STATUSES.has(status) ? (
            <p className="ops-type-caption ops-text-muted">{copy.readOnlyHint}</p>
          ) : null}
        </OpsPanelBody>
      </OpsPanel>

      <OpsRotateAdminCredentialsDialog
        tenantId={tenantId}
        open={rotateOpen}
        onOpenChange={setRotateOpen}
      />
    </>
  );
}
