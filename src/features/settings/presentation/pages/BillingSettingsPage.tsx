/**
 * BillingSettingsPage — hub permanente «Datos para facturar».
 *
 * Strip de preparación (identidad → sello → numeración + diagnóstico PAC),
 * numeración/defaults con Guardar; teaser a servicios de cobro.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  FormStickyActions,
  FormValidationSummary,
  UnsavedChangesDialog,
} from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import { useUnsavedChangesGuard } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { ROLES } from "@shared/constants/roles";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

import { SettingsPageShell } from "@shared/ui/page-shells";
import { BillingCertificateCard } from "../components/BillingCertificateCard";
import { BillingDefaultsCard } from "../components/BillingDefaultsCard";
import { BillingNumberingCard } from "../components/BillingNumberingCard";
import { BillingReadinessCard } from "../components/BillingReadinessCard";
import { BillingServiceConceptsCard } from "../components/BillingServiceConceptsCard";
import {
  useBillingSettings,
  useCompanySettings,
  useUpdateBillingSettings,
  useTestPacConnection,
  useRegisterPacEmitter,
} from "../../application/hooks";
import {
  PAC_USES_CREDENTIALS,
  resolveSelectablePacProvider,
  PacProviders,
  type PacProvider,
  type UpdateBillingSettingsDTO,
} from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  resolveCertificateReadiness,
  resolveIdentityReadiness,
  resolveNumberingReadiness,
  type BillingRequirementStatus,
} from "../utils/billingReadiness";
import {
  billingSettingsSchema,
  mapSettingsToForm,
  type BillingSettingsFormData,
} from "../validation/billingSettingsSchema";
import {
  billingSettingsHydrationKey,
  shouldHydrateBillingSettings,
} from "./billingSettingsHydration";

const copy = billingSettingsCopy;

export const BillingSettingsPage = memo(function BillingSettingsPage() {
  const { hasPermission, hasRole } = usePermissions();
  const { data: settings, isLoading, isError, refetch } = useBillingSettings();
  const { data: companySettings, isSuccess: companyReady } =
    useCompanySettings();
  const updateMutation = useUpdateBillingSettings();
  const testConnectionMutation = useTestPacConnection();
  const registerEmitterMutation = useRegisterPacEmitter();

  const canUpdateSettings = hasPermission("settings", "update");
  const canUploadCertificate = hasRole(ROLES.ADMIN);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const hydratedKeyRef = useRef<string | null>(null);
  const wasSubmittingRef = useRef(false);

  const form = useForm<BillingSettingsFormData>({
    resolver: zodResolver(billingSettingsSchema),
    mode: "onChange",
    defaultValues: { pacProvider: PacProviders.PROFACT },
  });
  const { handleSubmit, reset, formState } = form;
  const isDirty = formState.isDirty;
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
    enabled: canUpdateSettings,
  });

  useEffect(() => {
    if (!settings) return;
    if (!shouldHydrateBillingSettings(hydratedKeyRef.current, settings.id)) {
      return;
    }
    const next = mapSettingsToForm(settings);
    reset(next);
    hydratedKeyRef.current = billingSettingsHydrationKey(settings.id);
  }, [settings, reset]);

  useEffect(() => {
    if (updateMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [updateMutation.isPending, resetAllowLeave]);

  const onInvalid = useCallback(() => {
    setShowValidationSummary(true);
  }, []);

  const onSubmit = useCallback(
    (data: BillingSettingsFormData) => {
      if (!canUpdateSettings) return;
      setShowValidationSummary(false);

      const dto: UpdateBillingSettingsDTO = {
        pacProvider: resolveSelectablePacProvider(data.pacProvider),
        defaultUsoCfdi: data.defaultUsoCfdi,
        defaultFormaPago: data.defaultFormaPago,
        defaultMetodoPago: data.defaultMetodoPago,
        serieFactura: data.serieFactura,
        folioInicial: data.folioInicial,
        testMode: data.testMode,
        claveProductoServicio: data.claveProductoServicio,
        claveUnidad: data.claveUnidad,
        moneda: "MXN",
        tasaIva: data.tasaIva,
      };

      const usesCredentials =
        PAC_USES_CREDENTIALS[data.pacProvider as PacProvider] ?? false;
      if (usesCredentials) {
        if (data.pacUsername) dto.pacUsername = data.pacUsername;
        if (data.pacPassword) dto.pacPassword = data.pacPassword;
      }

      allowLeave();
      updateMutation.mutate(dto, {
        onSuccess: (result) => {
          reset(mapSettingsToForm(result.data));
        },
      });
    },
    [allowLeave, canUpdateSettings, reset, updateMutation],
  );

  const handleTestConnection = useCallback(() => {
    if (!canUpdateSettings || !settings) return;
    testConnectionMutation.mutate({
      pacProvider: resolveSelectablePacProvider(settings.pacProvider),
    });
  }, [canUpdateSettings, settings, testConnectionMutation]);

  const handleRegisterEmitter = useCallback(() => {
    if (!canUpdateSettings) return;
    registerEmitterMutation.mutate();
  }, [canUpdateSettings, registerEmitterMutation]);

  const identityReadiness = useMemo(
    () =>
      resolveIdentityReadiness(companySettings, { known: companyReady }),
    [companySettings, companyReady],
  );

  const certificateReadiness = useMemo(
    () =>
      resolveCertificateReadiness(
        settings ?? { certificateConfigured: false, certificateExpiry: null },
      ),
    [settings],
  );

  const numberingReadiness = useMemo(
    () =>
      resolveNumberingReadiness(
        settings ?? { serieFactura: "", folioInicial: 0 },
      ),
    [settings],
  );

  if (isLoading) {
    return (
      <SettingsPageShell
        sectionTitle={copy.page.sectionTitle}
        title={copy.page.title}
        description={copy.page.description}
      >
        <BillingSettingsPageSkeleton />
      </SettingsPageShell>
    );
  }

  if (isError || !settings) {
    return (
      <SettingsPageShell
        sectionTitle={copy.page.sectionTitle}
        title={copy.page.title}
        description={copy.page.description}
      >
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={copy.state.loadErrorTitle}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              {copy.state.retry}
            </Button>
          }
        >
          <p>{copy.state.loadErrorDescription}</p>
        </DetailAlertCard>
      </SettingsPageShell>
    );
  }

  const validationMessages = showValidationSummary
    ? collectFieldErrorMessages(form.formState.errors)
    : [];

  const provider = resolveSelectablePacProvider(settings.pacProvider);

  return (
    <SettingsPageShell
      sectionTitle={copy.page.sectionTitle}
      title={copy.page.title}
      description={copy.page.description}
    >
      <div className="space-y-6">
        {!canUpdateSettings && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{copy.state.readOnlyTitle}</AlertTitle>
            <AlertDescription>{copy.state.readOnlyDescription}</AlertDescription>
          </Alert>
        )}

        <BillingReadinessCard
          identity={identityReadiness}
          certificate={certificateReadiness}
          numbering={numberingReadiness}
          connection={toCheckStatus(testConnectionMutation.data?.success)}
          isCheckingConnection={testConnectionMutation.isPending}
          emitter={toCheckStatus(registerEmitterMutation.data?.success)}
          isRegisteringEmitter={registerEmitterMutation.isPending}
          certificateUploadRestricted={
            canUpdateSettings && !canUploadCertificate
          }
          provider={provider}
          canRunDiagnostics={canUpdateSettings}
          connectionResult={testConnectionMutation.data}
          emitterResult={registerEmitterMutation.data}
          onTestConnection={handleTestConnection}
          onRegisterEmitter={handleRegisterEmitter}
        />

        <BillingCertificateCard
          settings={settings}
          readiness={certificateReadiness}
          canUpload={canUploadCertificate}
          showRestrictionNotice={canUpdateSettings && !canUploadCertificate}
        />

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
          noValidate
        >
          <BillingNumberingCard
            form={form}
            settings={settings}
            canEdit={canUpdateSettings}
          />

          <BillingDefaultsCard
            form={form}
            settings={settings}
            canEdit={canUpdateSettings}
            defaultCollapsed
          />

          {canUpdateSettings && (
            <div className="space-y-4">
              <FormValidationSummary
                messages={validationMessages}
                title={copy.validation.summaryTitle}
                className="mb-0"
              />
              <FormStickyActions sticky>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowValidationSummary(false);
                    reset();
                  }}
                  disabled={!isDirty || updateMutation.isPending}
                >
                  {copy.action.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {updateMutation.isPending
                    ? copy.action.saving
                    : copy.action.save}
                </Button>
              </FormStickyActions>
            </div>
          )}
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {copy.extrasHeading}
          </p>
          <div className="space-y-2">
            <BillingServiceConceptsCard />
          </div>
        </div>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </SettingsPageShell>
  );
});

function toCheckStatus(success: boolean | undefined): BillingRequirementStatus {
  if (success === undefined) return "unknown";
  return success ? "ready" : "pending";
}

function BillingSettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((__, field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
