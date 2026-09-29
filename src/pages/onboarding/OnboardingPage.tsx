/**
 * Onboarding guiado de producto: pasos por familia + cierre persistente vía API.
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Palette, Sparkles, Wallet, ChevronRight } from "lucide-react";

import { useAuth } from "@features/auth";
import { authApi } from "@features/auth/infrastructure";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells";
import type { WizardStep } from "@shared/ui/wizard";
import { Button } from "@shared/ui/button";
import { BrandLockup } from "@shared/ui/brand";
import { ThemeSegmented } from "@shared/ui/theme";
import { mapBackendError } from "@shared/utils/errorMapper";
import { FLEET_BAND_LABELS } from "@shared/commercial/operationalPlanCatalog";
import { isDeclaredFleetBand } from "@shared/commercial/recommendOperationalPlan";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import {
  clearRegisterFunnelPreference,
  readRegisterFunnelPreference,
} from "../auth/register/registerFunnelPreference";
import {
  onboardingCopy as copy,
  resolveOnboardingHandshake,
  resolveOnboardingHouseLabel,
} from "./onboardingCopy";
import {
  readOnboardingFromState,
  resolveOnboardingFamily,
  resolveOnboardingLanding,
} from "./onboardingFamily";

function buildFounderSteps(isSelfServeFunnel: boolean): WizardStep[] {
  return [
    {
      id: "welcome",
      title: copy.steps.welcome.title,
      description: copy.steps.welcome.description,
    },
    {
      id: "preferences",
      title: copy.steps.preferences.title,
      description: copy.steps.preferences.description,
    },
    {
      id: "plan",
      title: copy.steps.plan.title,
      description: isSelfServeFunnel
        ? copy.steps.plan.descriptionB
        : copy.steps.plan.descriptionA,
    },
  ];
}

function buildHandshakeSteps(houseLabel: string): WizardStep[] {
  return [
    {
      id: "handshake",
      title: copy.steps.handshake.title,
      description: houseLabel,
    },
  ];
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wizardFormRef = useRef<WizardFormRef | null>(null);

  const displayName =
    user?.firstName?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const funnelPreference = useMemo(() => readRegisterFunnelPreference(), []);
  const isSelfServeFunnel = funnelPreference !== null;
  const canReadBilling = hasPermission("billing", "read");
  const family = resolveOnboardingFamily({
    role: user?.role,
    hasFunnelPreference: isSelfServeFunnel,
    canReadBilling,
  });
  const houseLabel = resolveOnboardingHouseLabel(user?.role, family);
  const handshake = resolveOnboardingHandshake(user?.role, displayName);
  const from = readOnboardingFromState(location.state);
  const landing = resolveOnboardingLanding({
    role: user?.role,
    fromPathname: from.fromPathname,
    fromSearch: from.fromSearch,
    family,
  });

  const { getByCode } = usePublicOperationalPlans();

  const steps = useMemo(
    () =>
      family === "founder"
        ? buildFounderSteps(isSelfServeFunnel)
        : buildHandshakeSteps(houseLabel),
    [family, houseLabel, isSelfServeFunnel],
  );

  const submitLabel =
    family === "founder"
      ? copy.header.submitFounder
      : copy.header.submitHouse(houseLabel);

  const headerSubtitle =
    family === "founder" ? copy.header.subtitle : houseLabel;

  const finish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await authApi.completeProductOnboarding();
      await refreshProfile();
      if (family === "founder") {
        clearRegisterFunnelPreference();
      }
      toast({
        title: copy.toast.successTitle,
        description: copy.toast.successDescription,
        variant: "success",
      });
      navigate(landing, { replace: true });
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      toast({
        title: copy.toast.errorTitle,
        description: mapped.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [family, landing, navigate, refreshProfile, toast]);

  useLayoutEffect(() => {
    wizardFormRef.current = {
      triggerStepValidation: async () => true,
      requestSubmit: () => {
        void finish();
      },
    };
  }, [finish]);

  const renderStep = useCallback(
    (currentStep: number) => {
      const stepId = steps[currentStep]?.id;
      switch (stepId) {
        case "welcome":
          return (
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.welcome.founderBody(displayName)}
              </p>
            </div>
          );
        case "preferences":
          return (
            <div className="space-y-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
                <Palette className="h-6 w-6" />
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    {copy.preferences.themeLabel}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {copy.preferences.themeHint}
                  </p>
                </div>
                <ThemeSegmented
                  alwaysShowLabels
                  className="w-full justify-between sm:w-auto sm:justify-start"
                />
              </div>
            </div>
          );
        case "plan": {
          if (funnelPreference === null) {
            return (
              <div className="space-y-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Wallet className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">
                    {copy.plan.assignedTitle}
                  </p>
                  {copy.plan.assignedParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-muted-foreground text-sm leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <p className="text-muted-foreground text-xs">
                    {copy.plan.assignedFooter}
                  </p>
                </div>
              </div>
            );
          }

          const preferredPlanName = getByCode(
            funnelPreference.preferredPlanCode,
          ).name;
          const indicatedFleetLabel =
            funnelPreference.declaredFleetBand &&
            isDeclaredFleetBand(funnelPreference.declaredFleetBand)
              ? FLEET_BAND_LABELS[funnelPreference.declaredFleetBand]
              : null;

          return (
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Wallet className="text-primary h-6 w-6" />
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">{copy.plan.trialTitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {copy.plan.trialBody}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">
                  {copy.plan.preferenceTitle}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {copy.plan.preferenceBody(preferredPlanName)}
                </p>
                {indicatedFleetLabel ? (
                  <p className="text-muted-foreground text-sm">
                    {copy.plan.fleetIndicated(indicatedFleetLabel)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  {copy.plan.ctaHint}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings/subscription">
                    {copy.plan.ctaSubscription}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        }
        case "handshake":
          return (
            <div className="space-y-4">
              <div className="bg-success-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <CheckCircle className="text-success-soft-foreground h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">
                {handshake.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {handshake.body}
              </p>
            </div>
          );
        default:
          return null;
      }
    },
    [displayName, funnelPreference, getByCode, handshake, steps],
  );

  if (family !== "founder") {
    return (
      <div className="bg-muted flex min-h-screen items-center justify-center px-4 py-10">
        <div className="bg-background w-full max-w-md space-y-6 rounded-xl p-8 shadow-sm">
          <div className="flex justify-center">
            <BrandLockup markSize={32} decorative />
          </div>

          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="bg-success-soft flex h-12 w-12 items-center justify-center rounded-xl">
              <CheckCircle className="text-success-soft-foreground h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-semibold tracking-tight">
                {handshake.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {handshake.body}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={() => void finish()}
              disabled={isSubmitting}
            >
              {isSubmitting ? copy.header.submitting : submitLabel}
            </Button>

            <div className="flex justify-center">
              <ThemeSegmented
                className="w-full justify-between sm:w-auto sm:justify-center"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WizardPageShell
      steps={steps}
      formRef={wizardFormRef}
      header={{
        backHref: "/dashboard",
        backLabel: copy.header.back,
        icon: <Sparkles className="h-5 w-5" />,
        title: copy.header.title,
        subtitle: headerSubtitle,
      }}
      headerBackMode="wizard"
      allowExit={false}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      submittingLabel={copy.header.submitting}
      stepsAriaLabel={copy.header.stepsAria}
    />
  );
}
