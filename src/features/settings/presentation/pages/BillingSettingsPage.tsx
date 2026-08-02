/**
 * BillingSettingsPage
 *
 * Puesta a punto para facturar: encabeza una ficha de preparación y sigue con
 * los bloques en el orden en que se resuelven (sello, numeración, valores que
 * se precargan, timbrado y servicios de cobro).
 *
 * Ubicación: src/features/settings/presentation/pages/BillingSettingsPage.tsx
 */

import { memo, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormValidationSummary } from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import { usePermissions } from "@shared/permissions";
import { ROLES } from "@shared/constants/roles";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

import { SettingsLayout } from "../components/SettingsLayout";
import { BillingCertificateCard } from "../components/BillingCertificateCard";
import { BillingDefaultsCard } from "../components/BillingDefaultsCard";
import { BillingNumberingCard } from "../components/BillingNumberingCard";
import { BillingReadinessCard } from "../components/BillingReadinessCard";
import { BillingServiceConceptsCard } from "../components/BillingServiceConceptsCard";
import { BillingStampingCard } from "../components/BillingStampingCard";
import {
  useBillingSettings,
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
  resolveNumberingReadiness,
  type BillingRequirementStatus,
} from "../utils/billingReadiness";
import {
  billingSettingsSchema,
  mapSettingsToForm,
  type BillingSettingsFormData,
} from "../validation/billingSettingsSchema";

const copy = billingSettingsCopy;

export const BillingSettingsPage = memo(function BillingSettingsPage() {
  const { hasPermission, hasRole } = usePermissions();
  const { data: settings, isLoading, isError, refetch } = useBillingSettings();
  const updateMutation = useUpdateBillingSettings();
  const testConnectionMutation = useTestPacConnection();
  const registerEmitterMutation = useRegisterPacEmitter();

  const canUpdateSettings = hasPermission("settings", "update");
  const canUploadCertificate = hasRole(ROLES.ADMIN);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<BillingSettingsFormData>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: { pacProvider: PacProviders.PROFACT },
    values: settings ? mapSettingsToForm(settings) : undefined,
  });

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
        moneda: data.moneda,
        tasaIva: data.tasaIva,
      };

      // Solo los timbradores con credenciales por empresa las envían.
      const usesCredentials =
        PAC_USES_CREDENTIALS[data.pacProvider as PacProvider] ?? false;
      if (usesCredentials) {
        if (data.pacUsername) dto.pacUsername = data.pacUsername;
        if (data.pacPassword) dto.pacPassword = data.pacPassword;
      }

      updateMutation.mutate(dto);
    },
    [canUpdateSettings, updateMutation],
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

  const certificateReadiness = useMemo(
    () =>
      resolveCertificateReadiness(
        settings ?? { certificateConfigured: false, certificateExpiry: null },
      ),
    [settings],
  );

  const numberingReadiness = useMemo(
    () =>
      resolveNumberingReadiness(settings ?? { serieFactura: "", folioInicial: 0 }),
    [settings],
  );

  if (isLoading) {
    return (
      <SettingsLayout
        sectionTitle={copy.page.sectionTitle}
        title={copy.page.title}
        description={copy.page.description}
      >
        <BillingSettingsPageSkeleton />
      </SettingsLayout>
    );
  }

  if (isError || !settings) {
    return (
      <SettingsLayout
        sectionTitle={copy.page.sectionTitle}
        title={copy.page.title}
        description={copy.page.description}
      >
        <EmptyState
          icon={<AlertTriangle />}
          title={copy.state.loadErrorTitle}
          description={copy.state.loadErrorDescription}
          cta={{
            label: copy.state.retry,
            icon: <RefreshCw />,
            onClick: () => void refetch(),
          }}
        />
      </SettingsLayout>
    );
  }

  const validationMessages = showValidationSummary
    ? collectFieldErrorMessages(form.formState.errors)
    : [];

  return (
    <SettingsLayout
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
          certificate={certificateReadiness}
          numbering={numberingReadiness}
          connection={toCheckStatus(testConnectionMutation.data?.success)}
          isCheckingConnection={testConnectionMutation.isPending}
          emitter={toCheckStatus(registerEmitterMutation.data?.success)}
          isRegisteringEmitter={registerEmitterMutation.isPending}
        />

        <BillingCertificateCard
          settings={settings}
          readiness={certificateReadiness}
          canUpload={canUploadCertificate}
          showRestrictionNotice={canUpdateSettings && !canUploadCertificate}
        />

        <form
          onSubmit={form.handleSubmit(onSubmit, () =>
            setShowValidationSummary(true),
          )}
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
          />

          {canUpdateSettings && (
            <div className="space-y-4">
              <FormValidationSummary
                messages={validationMessages}
                title={copy.validation.summaryTitle}
                className="mb-0"
              />
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowValidationSummary(false);
                    form.reset();
                  }}
                  disabled={!form.formState.isDirty || updateMutation.isPending}
                >
                  {copy.action.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isDirty || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {updateMutation.isPending
                    ? copy.action.saving
                    : copy.action.save}
                </Button>
              </div>
            </div>
          )}
        </form>

        <BillingStampingCard
          provider={resolveSelectablePacProvider(settings.pacProvider)}
          canRunActions={canUpdateSettings}
          connectionResult={testConnectionMutation.data}
          isTestingConnection={testConnectionMutation.isPending}
          onTestConnection={handleTestConnection}
          emitterResult={registerEmitterMutation.data}
          isRegisteringEmitter={registerEmitterMutation.isPending}
          onRegisterEmitter={handleRegisterEmitter}
        />

        <BillingServiceConceptsCard />
      </div>
    </SettingsLayout>
  );
});

// ============================================================================
// HELPERS
// ============================================================================

/** Las comprobaciones no se persisten: sin ejecutar en la sesión, se desconocen. */
function toCheckStatus(success: boolean | undefined): BillingRequirementStatus {
  if (success === undefined) return "unknown";
  return success ? "ready" : "pending";
}

// ============================================================================
// SKELETON
// ============================================================================

function BillingSettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-lg border p-6">
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
