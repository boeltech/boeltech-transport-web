import { useEffect, useState } from "react";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import type { PlatformEntitlementMutationPreview } from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";
import { useMutatePlatformTenantEntitlement } from "../../application/hooks/usePlatformBilling";
import { opsCopy } from "./opsCopy";
import { previewWarningLabel } from "./previewFormatters";
import { OpsMoneyAmount } from "./patterns/OpsMoneyTable";
import {
  OpsAlert,
  OpsButton,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
} from "./ui";

export interface OpsRemoveAddonTarget {
  moduleCode: string;
  moduleName: string;
  priceLockedCents: number;
}

interface OpsRemoveAddonDialogProps {
  tenantId: string;
  target: OpsRemoveAddonTarget | null;
  onOpenChange: (open: boolean) => void;
  resolveName: (code: string) => string;
}

export function OpsRemoveAddonDialog({
  tenantId,
  target,
  onOpenChange,
  resolveName,
}: OpsRemoveAddonDialogProps) {
  return (
    <OpsDialog open={target !== null} onOpenChange={onOpenChange}>
      <OpsDialogContent tone="danger" data-testid="ops-remove-addon-dialog">
        {target ? (
          <RemoveAddonBody
            key={target.moduleCode}
            tenantId={tenantId}
            target={target}
            onOpenChange={onOpenChange}
            resolveName={resolveName}
          />
        ) : null}
      </OpsDialogContent>
    </OpsDialog>
  );
}

function RemoveAddonBody({
  tenantId,
  target,
  onOpenChange,
  resolveName,
}: Omit<OpsRemoveAddonDialogProps, "target"> & {
  target: OpsRemoveAddonTarget;
}) {
  const copy = opsCopy.hub.modules.removeDialog;
  const { toast } = useToast();
  const [preview, setPreview] =
    useState<PlatformEntitlementMutationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutatePlatformTenantEntitlement();
  const { moduleCode } = target;

  useEffect(() => {
    let cancelled = false;
    void platformApi
      .previewTenantEntitlement(tenantId, { moduleCode, action: "cancel" })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setPreviewError(mapBackendError(error).message);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, moduleCode]);

  const handleConfirm = async () => {
    setApiError(null);
    try {
      await mutation.mutateAsync({
        tenantId,
        payload: { moduleCode, action: "deactivate" },
      });
      toast({ title: copy.success(target.moduleName), variant: "success" });
      onOpenChange(false);
    } catch (error) {
      const message = mapBackendError(error).message;
      setApiError(message);
      toast({ title: copy.error, description: message, variant: "error" });
    }
  };

  return (
    <>
      <OpsDialogHeader>
        <OpsDialogTitle>{copy.title}</OpsDialogTitle>
        <OpsDialogDescription>
          {copy.description(target.moduleName)}
        </OpsDialogDescription>
      </OpsDialogHeader>

      {apiError ? (
        <OpsAlert tone="danger" title={copy.error}>
          {apiError}
        </OpsAlert>
      ) : null}

      <div className="space-y-3 ops-type-caption">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="ops-text-muted">{copy.lockedPrice}</span>
          <OpsMoneyAmount cents={target.priceLockedCents} />
        </div>
        {previewLoading ? (
          <p className="ops-text-muted" role="status">
            {copy.loadingPreview}
          </p>
        ) : null}
        {previewError ? (
          <OpsAlert tone="warn" title={copy.previewFailedTitle}>
            <p>{previewError}</p>
            <p>{copy.previewFailedHint}</p>
          </OpsAlert>
        ) : null}
        {preview ? (
          <div className="space-y-2" data-testid="ops-remove-addon-preview">
            <div>
              <p className="font-medium ops-text-muted">{copy.modulesLost}</p>
              <p className="ops-text">
                {preview.modulesLost.length
                  ? preview.modulesLost.map(resolveName).join(", ")
                  : opsCopy.preview.none}
              </p>
            </div>
            {preview.warnings.length > 0 ? (
              <ul className="space-y-1 ops-text-warn">
                {preview.warnings.map((w) => (
                  <li key={w}>{previewWarningLabel(w)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <OpsDialogFooter>
        <OpsButton
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          {copy.cancel}
        </OpsButton>
        <OpsButton
          type="button"
          variant="danger"
          disabled={previewLoading || mutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {mutation.isPending ? copy.confirming : copy.confirm}
        </OpsButton>
      </OpsDialogFooter>
    </>
  );
}
