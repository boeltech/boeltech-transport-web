import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { LogIn, Building2, ShieldCheck } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import {
  isTurnstileConfigured,
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@shared/ui/turnstile";

import {
  authApi,
  tokenStorage,
  markFreshLoginSession,
  isMfaChallenge,
} from "@features/auth";
import { loginSchema, type LoginFormData } from "@features/auth";
import { mapBackendError } from "@shared/utils/errorMapper";
import { usePublicSelfServeRegister } from "@shared/commercial/usePublicSelfServeRegister";
import { AuthFunnelFormHeader } from "../AuthFunnelFormHeader";
import { PasswordVisibilityToggle } from "../PasswordVisibilityToggle";
import { authFunnelCopy } from "../authFunnelCopy";
import { loginCopy as copy } from "./loginCopy";

/**
 * LoginPage — auth multi-tenant fuera de AuthProvider.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { open: registrationOpen } = usePublicSelfServeRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldSummary, setShowFieldSummary] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(
    null,
  );
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFieldError, setMfaFieldError] = useState<string | null>(null);
  const [pendingSubdomain, setPendingSubdomain] = useState("");

  const locationState =
    location.state as { from?: { pathname: string }; sessionExpired?: boolean } | null;

  const from = locationState?.from?.pathname || "/dashboard";
  const sessionExpired = locationState?.sessionExpired === true;
  const inviteEmail =
    (location.state as { inviteEmail?: string } | null)?.inviteEmail ?? "";

  const savedSubdomain = tokenStorage.getSubdomain() || "";
  const subdomainFromQuery = searchParams.get("subdomain")?.trim() || "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData, unknown, LoginFormData>({
    resolver: zodResolver(loginSchema) as Resolver<LoginFormData>,
    defaultValues: {
      email: "",
      password: "",
      subdomain: savedSubdomain,
    },
  });

  useEffect(() => {
    reset({
      email: inviteEmail,
      password: "",
      subdomain: subdomainFromQuery || savedSubdomain,
    });
  }, [inviteEmail, subdomainFromQuery, savedSubdomain, reset]);

  const fieldSummaryMessages = [
    errors.subdomain?.message,
    errors.email?.message,
    errors.password?.message,
  ].filter((m): m is string => Boolean(m));

  const finishLogin = (response: {
    accessToken?: string;
    refreshToken?: string;
    user: {
      onboardingCompletedAt?: string | null;
    };
  }, subdomain: string) => {
    if (response.accessToken && response.refreshToken) {
      tokenStorage.setToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
    } else {
      tokenStorage.removeToken();
      tokenStorage.removeRefreshToken();
    }
    tokenStorage.setUser(response.user as Parameters<typeof tokenStorage.setUser>[0]);
    tokenStorage.setSubdomain(subdomain);
    markFreshLoginSession();

    if (response.user.onboardingCompletedAt == null) {
      navigate("/onboarding", { replace: true });
      return;
    }

    navigate(from, { replace: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setShowFieldSummary(false);

    if (isTurnstileConfigured() && !captchaToken) {
      setError(authFunnelCopy.captchaRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const subdomain = data.subdomain.toLowerCase();
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        subdomain,
        ...(captchaToken ? { captchaToken } : {}),
      });

      if (isMfaChallenge(response)) {
        setMfaChallengeToken(response.mfaChallengeToken);
        setPendingSubdomain(subdomain);
        setMfaCode("");
        return;
      }

      finishLogin(response, subdomain);
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      let message = mapped.message;
      if (!navigator.onLine) {
        message = copy.offline;
      }
      setError(message);
      // Token Turnstile = un solo uso (también si el login falló por credenciales).
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallengeToken) return;
    if (mfaCode.trim().length < 6) {
      setMfaFieldError(copy.mfa.codeRequired);
      return;
    }
    setMfaFieldError(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await authApi.verifyMfaLogin({
        mfaChallengeToken,
        code: mfaCode.trim(),
      });
      finishLogin(response, pendingSubdomain);
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      setError(!navigator.onLine ? copy.offline : mapped.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <AuthFunnelFormHeader
        title={mfaChallengeToken ? copy.mfa.title : copy.title}
        description={
          mfaChallengeToken ? copy.mfa.description : copy.description
        }
      />

      {sessionExpired && !mfaChallengeToken && (
        <AlertWithIcon variant="default" className="mb-6">
          {copy.sessionExpired}
        </AlertWithIcon>
      )}

      {error && (
        <AlertWithIcon variant="destructive" className="mb-6">
          {error}
        </AlertWithIcon>
      )}

      {mfaChallengeToken ? (
        <form onSubmit={onMfaSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">{copy.mfa.codeLabel}</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={copy.mfa.codePlaceholder}
              value={mfaCode}
              onChange={(ev) => {
                setMfaCode(ev.target.value);
                if (mfaFieldError) setMfaFieldError(null);
              }}
              autoFocus
              error={Boolean(mfaFieldError)}
              aria-invalid={Boolean(mfaFieldError)}
              aria-describedby={mfaFieldError ? "mfa-code-error" : undefined}
            />
            <FieldInlineError
              fieldId="mfa-code"
              message={mfaFieldError ?? undefined}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {!isSubmitting && <ShieldCheck className="mr-2 h-4 w-4" />}
            {isSubmitting ? copy.mfa.submitting : copy.mfa.submit}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => {
              setMfaChallengeToken(null);
              setMfaCode("");
              setError(null);
              setMfaFieldError(null);
            }}
          >
            {copy.mfa.back}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit, () => setShowFieldSummary(true))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="subdomain">{copy.fields.subdomain}</Label>
            <div className="relative">
              <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="subdomain"
                type="text"
                placeholder={copy.fields.subdomainPlaceholder}
                autoComplete="organization"
                className="pl-10"
                {...register("subdomain")}
                {...getRegisterFieldErrorProps(
                  "subdomain",
                  errors.subdomain?.message,
                )}
              />
            </div>
            <FieldInlineError
              fieldId="subdomain"
              message={errors.subdomain?.message}
            />
            {!errors.subdomain && (
              <p className="text-muted-foreground text-sm">
                {copy.fields.subdomainHint}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{copy.fields.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={copy.fields.emailPlaceholder}
              autoComplete="email"
              {...register("email")}
              {...getRegisterFieldErrorProps("email", errors.email?.message)}
            />
            <FieldInlineError fieldId="email" message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{copy.fields.password}</Label>
              <Link
                to="/forgot-password"
                className="text-primary text-xs hover:underline"
              >
                {copy.fields.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={copy.fields.passwordPlaceholder}
                autoComplete="current-password"
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
          </div>

          {showFieldSummary && fieldSummaryMessages.length > 0 ? (
            <FormValidationSummary
              title={copy.validationSummaryTitle}
              messages={fieldSummaryMessages}
            />
          ) : null}

          <TurnstileWidget
            ref={turnstileRef}
            onToken={setCaptchaToken}
            className="flex justify-center"
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {!isSubmitting && <LogIn className="mr-2 h-4 w-4" />}
            {isSubmitting ? copy.submitting : copy.submit}
          </Button>
        </form>
      )}

      {!mfaChallengeToken && (
        <div className="mt-8 text-center">
          {registrationOpen ? (
            <p className="text-muted-foreground text-sm">
              {copy.registerPrompt}{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                {copy.registerLink}
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {copy.registerClosedHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
