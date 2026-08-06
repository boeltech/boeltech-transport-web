import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
  PasswordRequirementsList,
} from "@shared/ui/form";
import {
  isTurnstileConfigured,
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@shared/ui/turnstile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { apiClient } from "@shared/api";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  markFreshLoginSession,
  tokenStorage,
} from "@features/auth/infrastructure";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";
import {
  registerSchema,
  type RegisterFormData,
  type TenantData,
} from "@features/auth";
import type { UserRole } from "@shared/constants/roles";
import {
  DECLARED_FLEET_BANDS,
  DEFAULT_OPERATIONAL_PLAN_CODE,
  recommendOperationalPlanCode,
  type DeclaredFleetBand,
} from "@shared/commercial/recommendOperationalPlan";
import { FLEET_BAND_LABELS } from "@shared/commercial/operationalPlanCatalog";
import { useCheckSubdomainAvailability } from "@shared/commercial/useCheckSubdomainAvailability";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import { usePublicSelfServeRegister } from "@shared/commercial/usePublicSelfServeRegister";
import { AuthFunnelFormHeader } from "../AuthFunnelFormHeader";
import { PasswordVisibilityToggle } from "../PasswordVisibilityToggle";
import { useAuthFunnelBrandSlot } from "../AuthFunnelShellContext";
import { RegisterBrandStepper } from "./RegisterBrandStepper";
import {
  REGISTER_FUNNEL_STEPS,
  type RegisterFunnelStep,
} from "./registerFunnelSteps";
import { registerFunnelCopy as copy } from "./registerFunnelCopy";
import { saveRegisterFunnelPreference } from "./registerFunnelPreference";
import { authFunnelCopy } from "../authFunnelCopy";

type Step = RegisterFunnelStep;

const STEPS = REGISTER_FUNNEL_STEPS;
const FLEET_BAND_NONE = "__none__";

interface RegisterUserApi {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant: TenantData;
  email_verified_at?: string | null;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { open: registrationOpen, resolved: registrationResolved } =
    usePublicSelfServeRegister();

  const [step, setStep] = useState<Step>("company");
  const [stepDirection, setStepDirection] = useState<"forward" | "back">(
    "forward",
  );
  const previousStepIndexRef = useRef(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stepSummaryMessages, setStepSummaryMessages] = useState<string[]>([]);
  const [subdomainOverrideSuggestion, setSubdomainOverrideSuggestion] =
    useState<string | null>(null);

  const [declaredFleetBand, setDeclaredFleetBand] =
    useState<DeclaredFleetBand | null>(null);
  const [preferredPlanCode, setPreferredPlanCode] = useState(
    DEFAULT_OPERATIONAL_PLAN_CODE,
  );

  const { plans, getByCode } = usePublicOperationalPlans();

  const recommendedPlanCode = useMemo(
    () => recommendOperationalPlanCode({ band: declaredFleetBand }),
    [declaredFleetBand],
  );

  const preferredPlan = getByCode(preferredPlanCode);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getFieldState,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const watchSubdomain = watch("subdomain");
  const watchAcceptTerms = watch("acceptTerms");
  const watchPassword = watch("password") ?? "";

  const {
    available: subdomainAvailable,
    suggestion: subdomainCheckSuggestion,
    isChecking: isCheckingSubdomain,
  } = useCheckSubdomainAvailability(watchSubdomain);

  const subdomainSuggestion =
    subdomainOverrideSuggestion ?? subdomainCheckSuggestion;

  useAuthFunnelBrandSlot(
    () =>
      registrationOpen ? (
        <RegisterBrandStepper currentStep={step} variant="panel" />
      ) : null,
    [step, registrationOpen],
  );

  const moveToStep = (newStep: Step) => {
    const nextIndex = STEPS.indexOf(newStep);
    const prevIndex = previousStepIndexRef.current;
    setStepDirection(nextIndex >= prevIndex ? "forward" : "back");
    previousStepIndexRef.current = nextIndex;
    // Evita banners API stale (p. ej. HIBP) al volver a editar y re-entrar a Confirmar.
    setError(null);
    setStep(newStep);
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomainOverrideSuggestion(null);
    setValue("subdomain", value, { shouldDirty: true, shouldValidate: false });
  };

  const handleFleetBandChange = (value: string) => {
    const band =
      value === FLEET_BAND_NONE ? null : (value as DeclaredFleetBand);
    setDeclaredFleetBand(band);
    setPreferredPlanCode(recommendOperationalPlanCode({ band }));
  };

  const collectFieldMessages = (fields: (keyof RegisterFormData)[]) => {
    const messages: string[] = [];
    for (const name of fields) {
      const { error } = getFieldState(name);
      if (error?.message) messages.push(String(error.message));
    }
    return messages;
  };

  const goToStep = async (newStep: Step) => {
    setStepSummaryMessages([]);
    if (newStep === "plan" && step === "company") {
      const isValid = await trigger(["companyName", "subdomain"]);
      const messages = collectFieldMessages(["companyName", "subdomain"]);
      if (isCheckingSubdomain || subdomainAvailable !== true) {
        messages.push(copy.validation.subdomainTaken);
      }
      if (!isValid || isCheckingSubdomain || subdomainAvailable !== true) {
        setStepSummaryMessages(messages);
        return;
      }
    }
    if (newStep === "admin" && step === "plan") {
      if (!preferredPlanCode) return;
    }
    if (newStep === "confirm" && step === "admin") {
      const fields: (keyof RegisterFormData)[] = [
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
      ];
      const isValid = await trigger(fields);
      if (!isValid) {
        setStepSummaryMessages(collectFieldMessages(fields));
        return;
      }
    }
    moveToStep(newStep);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    if (isTurnstileConfigured() && !captchaToken) {
      setError(authFunnelCopy.captchaRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      saveRegisterFunnelPreference({
        declaredFleetBand,
        preferredPlanCode,
      });

      const response = await apiClient.post<{
        message: string;
        data: {
          access_token: string;
          refresh_token: string;
          user: RegisterUserApi;
        };
      }>("/onboarding/register", {
        company: {
          name: data.companyName,
          subdomain: data.subdomain,
        },
        admin: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        acceptTerms: data.acceptTerms,
        planCode: preferredPlanCode,
        ...(declaredFleetBand ? { declaredFleetBand } : {}),
        ...(captchaToken ? { captchaToken } : {}),
      });

      if (response.data.access_token && response.data.refresh_token) {
        tokenStorage.setToken(response.data.access_token);
        tokenStorage.setRefreshToken(response.data.refresh_token);
      } else {
        tokenStorage.removeToken();
        tokenStorage.removeRefreshToken();
      }
      platformTokenStorage.clear();
      tokenStorage.setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.first_name,
        lastName: response.data.user.last_name,
        role: response.data.user.role,
        tenant: response.data.user.tenant,
        onboardingCompletedAt: null,
        emailVerifiedAt: response.data.user.email_verified_at ?? null,
      });
      tokenStorage.setSubdomain(data.subdomain);
      markFreshLoginSession();

      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      const errorMsg = mapped.message || "Error al registrar la empresa";
      setError(errorMsg);

      const apiError = err as
        | {
            response?: {
              data?: { details?: { suggestion?: string } };
            };
          }
        | undefined;

      if (
        errorMsg.includes("identificador") ||
        errorMsg.includes("subdomain")
      ) {
        moveToStep("company");
        if (apiError?.response?.data?.details?.suggestion) {
          setSubdomainOverrideSuggestion(
            apiError.response.data.details.suggestion,
          );
        }
      }
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationResolved) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <div className="w-full space-y-6">
        <AuthFunnelFormHeader
          title={copy.closed.title}
          description={copy.closed.description}
        />
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <a href={copy.closed.contactHref}>{copy.closed.contact}</a>
          </Button>
          <Button variant="outline" asChild size="lg" className="w-full">
            <Link to="/login">{copy.closed.login}</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link to="/welcome">{copy.closed.home}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <RegisterBrandStepper
        currentStep={step}
        variant="compact"
        className="lg:hidden"
      />

      <div
        key={step}
        className={
          stepDirection === "forward"
            ? "auth-funnel-step-forward"
            : "auth-funnel-step-back"
        }
      >
        <AuthFunnelFormHeader
          title={copy.steps[step].title}
          description={copy.steps[step].description}
        />

        {error && (
          <AlertWithIcon variant="destructive" className="mb-6">
            {error}
          </AlertWithIcon>
        )}

        {stepSummaryMessages.length > 0 ? (
          <FormValidationSummary
            title={copy.validation.summaryTitle}
            messages={stepSummaryMessages}
            className="mb-6"
          />
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            const messages = collectFieldMessages([
              "companyName",
              "subdomain",
              "firstName",
              "lastName",
              "email",
              "password",
              "confirmPassword",
              "acceptTerms",
            ]);
            setStepSummaryMessages(messages);
          })}
          className="space-y-4"
        >
            {step === "company" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">{copy.company.nameLabel}</Label>
                  <div className="relative">
                    <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="companyName"
                      placeholder={copy.company.namePlaceholder}
                      className="pl-10"
                      {...register("companyName")}
                      {...getRegisterFieldErrorProps(
                        "companyName",
                        errors.companyName?.message,
                      )}
                    />
                  </div>
                  <FieldInlineError
                    fieldId="companyName"
                    message={errors.companyName?.message}
                  />
                  {!errors.companyName && (
                    <p className="text-muted-foreground text-xs">
                      {copy.company.nameHint}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">{copy.company.subdomainLabel}</Label>
                  <div className="relative">
                    <Input
                      id="subdomain"
                      placeholder={copy.company.subdomainPlaceholder}
                      {...register("subdomain")}
                      onChange={handleSubdomainChange}
                      error={
                        Boolean(errors.subdomain?.message) ||
                        subdomainAvailable === false
                      }
                      {...(errors.subdomain?.message
                        ? getFieldErrorAriaProps(
                            "subdomain",
                            errors.subdomain.message,
                          )
                        : subdomainAvailable === false
                          ? {
                              "aria-invalid": true as const,
                              "aria-describedby": "subdomain-availability-error",
                            }
                          : { "aria-invalid": false as const })}
                    />
                    {isCheckingSubdomain && (
                      <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === true && (
                      <CheckCircle className="text-success absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                    )}
                  </div>
                  <FieldInlineError
                    fieldId="subdomain"
                    message={
                      errors.subdomain?.message ??
                      (subdomainAvailable === false
                        ? copy.company.subdomainUnavailable
                        : undefined)
                    }
                  />
                  {subdomainAvailable === false &&
                  !errors.subdomain &&
                  subdomainSuggestion ? (
                    <button
                      type="button"
                      className="text-primary text-xs underline"
                      onClick={() => {
                        setValue("subdomain", subdomainSuggestion, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      {copy.company.subdomainUseSuggestion(subdomainSuggestion)}
                    </button>
                  ) : null}
                  {subdomainAvailable === true && (
                    <p className="text-success text-sm">
                      {copy.company.subdomainAvailable}
                    </p>
                  )}
                  {!errors.subdomain && subdomainAvailable !== false && (
                    <p className="text-muted-foreground text-xs">
                      {copy.company.subdomainHint}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={() => goToStep("plan")}
                  disabled={
                    !watchSubdomain ||
                    isCheckingSubdomain ||
                    subdomainAvailable !== true
                  }
                >
                  {copy.actions.continue}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {step === "plan" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="declaredFleetBand">{copy.plan.fleetLabel}</Label>
                  <Select
                    value={declaredFleetBand ?? FLEET_BAND_NONE}
                    onValueChange={handleFleetBandChange}
                  >
                    <SelectTrigger id="declaredFleetBand">
                      <SelectValue placeholder={copy.plan.fleetPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FLEET_BAND_NONE}>
                        {copy.plan.fleetNone}
                      </SelectItem>
                      {DECLARED_FLEET_BANDS.map((band) => (
                        <SelectItem key={band} value={band}>
                          {FLEET_BAND_LABELS[band]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    {copy.plan.fleetHint}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredPlanCode">{copy.plan.planLabel}</Label>
                  <Select
                    value={preferredPlanCode}
                    onValueChange={setPreferredPlanCode}
                  >
                    <SelectTrigger id="preferredPlanCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.code} value={plan.code}>
                          <span className="flex items-center gap-2">
                            {plan.name}
                            {plan.code === recommendedPlanCode ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {copy.plan.recommendedBadge}
                              </Badge>
                            ) : null}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    {copy.plan.planHint}
                  </p>
                </div>

                <div className="bg-muted/40 space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">{copy.plan.previewTitle}</p>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {preferredPlan.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {copy.plan.priceListLabel}
                    </p>
                    <p className="text-primary text-xl font-bold tracking-tight tabular-nums">
                      {preferredPlan.priceAmount}
                      <span className="text-muted-foreground ml-1 text-sm font-medium">
                        {preferredPlan.pricePeriod}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      {copy.plan.capacityLabel}
                    </p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>{preferredPlan.unitsLabel}</li>
                      <li>{preferredPlan.usersLabel}</li>
                      <li>{preferredPlan.branchesLabel}</li>
                      <li>{preferredPlan.stampsLabel}</li>
                    </ul>
                  </div>
                  <p className="text-foreground text-xs font-medium">
                    {copy.plan.trialNote}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {copy.plan.priceNote}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStepSummaryMessages([]);
                      moveToStep("company");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {copy.actions.back}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    size="lg"
                    onClick={() => goToStep("admin")}
                  >
                    {copy.actions.continue}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === "admin" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{copy.admin.firstNameLabel}</Label>
                    <Input
                      id="firstName"
                      placeholder={copy.admin.firstNamePlaceholder}
                      autoComplete="given-name"
                      {...register("firstName")}
                      {...getRegisterFieldErrorProps(
                        "firstName",
                        errors.firstName?.message,
                      )}
                    />
                    <FieldInlineError
                      fieldId="firstName"
                      message={errors.firstName?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{copy.admin.lastNameLabel}</Label>
                    <Input
                      id="lastName"
                      placeholder={copy.admin.lastNamePlaceholder}
                      autoComplete="family-name"
                      {...register("lastName")}
                      {...getRegisterFieldErrorProps(
                        "lastName",
                        errors.lastName?.message,
                      )}
                    />
                    <FieldInlineError
                      fieldId="lastName"
                      message={errors.lastName?.message}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{copy.admin.emailLabel}</Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={copy.admin.emailPlaceholder}
                      autoComplete="email"
                      className="pl-10"
                      {...register("email")}
                      {...getRegisterFieldErrorProps(
                        "email",
                        errors.email?.message,
                      )}
                    />
                  </div>
                  <FieldInlineError
                    fieldId="email"
                    message={errors.email?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{copy.admin.passwordLabel}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={copy.admin.passwordPlaceholder}
                      className="pr-10"
                      {...register("password")}
                      {...getRegisterFieldErrorProps(
                        "password",
                        errors.password?.message,
                      )}
                    />
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                      showLabel={authFunnelCopy.showPassword}
                      hideLabel={authFunnelCopy.hidePassword}
                    />
                  </div>
                  <FieldInlineError
                    fieldId="password"
                    message={errors.password?.message}
                  />
                  <PasswordRequirementsList password={watchPassword} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {copy.admin.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={copy.admin.confirmPasswordPlaceholder}
                      className="pr-10"
                      {...register("confirmPassword")}
                      {...getRegisterFieldErrorProps(
                        "confirmPassword",
                        errors.confirmPassword?.message,
                      )}
                    />
                    <PasswordVisibilityToggle
                      visible={showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                      showLabel={authFunnelCopy.showPassword}
                      hideLabel={authFunnelCopy.hidePassword}
                    />
                  </div>
                  <FieldInlineError
                    fieldId="confirmPassword"
                    message={errors.confirmPassword?.message}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStepSummaryMessages([]);
                      moveToStep("plan");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {copy.actions.back}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    size="lg"
                    onClick={() => goToStep("confirm")}
                  >
                    {copy.actions.continue}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {copy.confirm.company}
                    </p>
                    <p className="font-medium">{watch("companyName")}</p>
                    <p className="text-muted-foreground text-sm">
                      {watch("subdomain")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {copy.confirm.admin}
                    </p>
                    <p className="font-medium">
                      {watch("firstName")} {watch("lastName")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {watch("email")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {copy.confirm.plan}
                    </p>
                    <p className="font-medium">{preferredPlan.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {copy.confirm.fleet}:{" "}
                      {declaredFleetBand
                        ? FLEET_BAND_LABELS[declaredFleetBand]
                        : copy.confirm.fleetNone}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {copy.confirm.serverNote}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={watchAcceptTerms}
                    onCheckedChange={(checked) =>
                      setValue("acceptTerms", checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="cursor-pointer text-sm leading-none font-medium"
                    >
                      {copy.confirm.acceptTerms}
                    </label>
                    <p className="text-muted-foreground text-xs">
                      {copy.confirm.termsPrefix}{" "}
                      <Link
                        to="/terms"
                        className="text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {copy.confirm.terms}
                      </Link>{" "}
                      {copy.confirm.and}{" "}
                      <Link
                        to="/privacy"
                        className="text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {copy.confirm.privacy}
                      </Link>
                    </p>
                  </div>
                </div>
                <FieldInlineError
                  fieldId="acceptTerms"
                  message={errors.acceptTerms?.message}
                />

                <TurnstileWidget
                  ref={turnstileRef}
                  onToken={setCaptchaToken}
                  className="flex justify-center"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStepSummaryMessages([]);
                      moveToStep("admin");
                    }}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {copy.actions.back}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={isSubmitting || !watchAcceptTerms}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? copy.actions.creating : copy.actions.create}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              {copy.loginPrompt}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {copy.loginLink}
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
};

export default RegisterPage;
