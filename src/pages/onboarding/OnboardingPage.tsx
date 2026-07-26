/**
 * Onboarding guiado de producto: pasos en WizardPageShell + cierre persistente vía API.
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Map,
  Palette,
  Sparkles,
  Wallet,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "@features/auth";
import { authApi } from "@features/auth/infrastructure";
import { ROLE_LABELS } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells";
import type { WizardStep } from "@shared/ui/wizard";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { ThemeSegmented } from "@shared/ui/theme";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  FLEET_BAND_LABELS,
} from "@shared/commercial/operationalPlanCatalog";
import { isDeclaredFleetBand } from "@shared/commercial/recommendOperationalPlan";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import { readRegisterFunnelPreference } from "../auth/register/registerFunnelPreference";
import { onboardingCopy as copy } from "./onboardingCopy";

const STEPS: WizardStep[] = [
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
    description: copy.steps.plan.description,
  },
  {
    id: "workspace",
    title: copy.steps.workspace.title,
    description: copy.steps.workspace.description,
  },
  {
    id: "review",
    title: copy.steps.review.title,
    description: copy.steps.review.description,
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wizardFormRef = useRef<WizardFormRef | null>(null);

  const displayName =
    user?.firstName?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as UserRole] ?? user.role
    : "";

  const funnelPreference = useMemo(() => readRegisterFunnelPreference(), []);
  const { getByCode } = usePublicOperationalPlans();
  const preferredPlan = getByCode(funnelPreference?.preferredPlanCode);
  const fleetLabel =
    funnelPreference?.declaredFleetBand &&
    isDeclaredFleetBand(funnelPreference.declaredFleetBand)
      ? FLEET_BAND_LABELS[funnelPreference.declaredFleetBand]
      : copy.plan.fleetNone;

  const finish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await authApi.completeProductOnboarding();
      await refreshProfile();
      toast({
        title: copy.toast.successTitle,
        description: copy.toast.successDescription,
        variant: "success",
      });
      navigate("/dashboard", { replace: true });
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
  }, [navigate, refreshProfile, toast]);

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
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.welcome.body(displayName, roleLabel)}
              </p>
            </div>
          );
        case 1:
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
        case 2:
          return (
            <div className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Wallet className="text-primary h-6 w-6" />
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {copy.plan.preferredTitle}
                  </p>
                  <Badge variant="info" tone="soft">
                    Orientativo
                  </Badge>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {copy.plan.planLabel}:{" "}
                  </span>
                  <span className="font-medium">{preferredPlan.name}</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {copy.plan.fleetLabel}: {fleetLabel}
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
                  <li>{preferredPlan.priceLabel}</li>
                  <li>{preferredPlan.usersLabel}</li>
                  <li>{preferredPlan.branchesLabel}</li>
                  <li>{preferredPlan.stampsLabel}</li>
                </ul>
              </div>

              <div className="bg-muted/40 space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">{copy.plan.serverTitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {copy.plan.serverBody}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-dashed p-4">
                <p className="text-sm font-medium">{copy.plan.trialTitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {copy.plan.trialBody}
                </p>
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
        case 3:
          return (
            <div className="space-y-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-xl">
                <Map className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.workspace.body}
              </p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                {copy.workspace.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          );
        case 4:
          return (
            <div className="space-y-4">
              <div className="bg-success-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <CheckCircle className="text-success-soft-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.review.body}
              </p>
            </div>
          );
        default:
          return null;
      }
    },
    [
      displayName,
      roleLabel,
      preferredPlan,
      fleetLabel,
    ],
  );

  return (
    <WizardPageShell
      steps={STEPS}
      formRef={wizardFormRef}
      header={{
        backHref: "/dashboard",
        backLabel: copy.header.back,
        icon: <Sparkles className="h-5 w-5" />,
        title: copy.header.title,
        subtitle: copy.header.subtitle,
      }}
      headerBackMode="wizard"
      allowExit={false}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel={copy.header.submit}
      submittingLabel={copy.header.submitting}
      stepsAriaLabel={copy.header.stepsAria}
    />
  );
}
