import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { mapBackendError } from "@shared/utils/errorMapper";
import type {
  PlatformEntitlementMutationPreview,
  PlatformTenantListItem,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";
import {
  useMutatePlatformTenantEntitlement,
  usePlatformModules,
} from "../../application/hooks/usePlatformBilling";
import {
  attachPlatformAddonSchema,
  type AttachPlatformAddonFormData,
} from "../validation";
import { opsCopy } from "./opsCopy";
import {
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
} from "./ui";

interface OpsAttachAddonSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModuleCode?: string | null;
}

export function OpsAttachAddonSheet({
  tenant,
  open,
  onOpenChange,
  initialModuleCode = null,
}: OpsAttachAddonSheetProps) {
  const copy = opsCopy.preview;
  const { toast } = useToast();
  const { data: modules = [], isLoading: modulesLoading } = usePlatformModules();
  const [preview, setPreview] =
    useState<PlatformEntitlementMutationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const form = useForm<AttachPlatformAddonFormData>({
    resolver: zodResolver(attachPlatformAddonSchema),
    defaultValues: { moduleCode: "" },
  });

  const moduleCode = form.watch("moduleCode");

  const mutate = useMutatePlatformTenantEntitlement({
    onSuccess: () => {
      toast({ title: copy.applyAddonSuccess, variant: "success" });
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
        form.reset({ moduleCode: "" });
        setPreview(null);
        setPreviewError(null);
      }
      return;
    }
    form.reset({ moduleCode: initialModuleCode?.trim() || "" });
    setPreview(null);
    setPreviewError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate per open
  }, [open, tenant?.id, initialModuleCode]);

  useEffect(() => {
    if (!open || !tenant || !moduleCode) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    void platformApi
      .previewTenantEntitlement(tenant.id, {
        moduleCode,
        action: "activate",
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
  }, [open, tenant, moduleCode]);

  const fieldErrors = collectFieldErrorMessages(form.formState.errors);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return;
    await mutate.mutateAsync({
      tenantId: tenant.id,
      payload: { moduleCode: values.moduleCode, action: "activate" },
    });
  });

  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="overflow-y-auto sm:max-w-lg"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-attach-addon-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.attachTitle}</OpsSheetTitle>
          <OpsSheetDescription>
            {copy.attachDescription}
            {tenant ? ` · ${tenant.name}` : null}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
          <OpsFormErrors messages={fieldErrors} />

          <div className="space-y-1.5">
            <OpsLabel htmlFor="ops-module-code">{copy.moduleLabel}</OpsLabel>
            <OpsSelect
              value={moduleCode || undefined}
              onValueChange={(value) =>
                form.setValue("moduleCode", value, { shouldValidate: true })
              }
              disabled={modulesLoading || mutate.isPending}
            >
              <OpsSelectTrigger
                id="ops-module-code"
                error={Boolean(form.formState.errors.moduleCode)}
                aria-invalid={Boolean(form.formState.errors.moduleCode)}
              >
                <OpsSelectValue placeholder={copy.moduleLabel} />
              </OpsSelectTrigger>
              <OpsSelectContent>
                {modules.map((mod) => (
                  <OpsSelectItem key={mod.code} value={mod.code}>
                    {mod.name} ({mod.code})
                  </OpsSelectItem>
                ))}
              </OpsSelectContent>
            </OpsSelect>
            <OpsFieldError
              fieldId="ops-module-code"
              message={form.formState.errors.moduleCode?.message}
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
            <div className="ops-preview space-y-3" data-testid="ops-addon-preview">
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
              {preview.warnings.length > 0 ? (
                <ul className="space-y-1 text-xs ops-text-warn">
                  {preview.warnings.map((w) => (
                    <li key={w}>{previewWarningLabel(w)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <OpsSheetFooter className="gap-2 sm:justify-end">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutate.isPending}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton
              type="submit"
              disabled={
                !preview ||
                previewLoading ||
                Boolean(previewError) ||
                mutate.isPending ||
                Boolean(
                  preview?.warnings.includes("ENTITLEMENT_ALREADY_ACTIVE") ||
                    preview?.warnings.includes("PLAN_PREREQUISITE_NOT_MET"),
                )
              }
            >
              {copy.applyAddon}
            </OpsButton>
          </OpsSheetFooter>
        </form>
      </OpsSheetContent>
    </OpsSheet>
  );
}
