import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { PasswordVisibilityToggle } from "@pages/auth/PasswordVisibilityToggle";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "../../infrastructure/platformTokenStorage";
import { platformApi } from "../../infrastructure/platformApi";
import { isPlatformMfaChallenge } from "../../domain/entities";
import {
  platformLoginSchema,
  platformMfaCodeSchema,
  type PlatformLoginFormData,
  type PlatformMfaCodeFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
import {
  OpsAlert,
  OpsBrandMark,
  OpsButton,
  OpsInput,
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../ops/ui";
import { OpsThemeProvider, useOpsTheme } from "../ops/OpsThemeProvider";
import "../ops/opsTokens.css";

/**
 * Login platform Ops — `.platform-ops` + tema resuelto (sin ThemeToggle, LID-D4).
 * Marca = OpsBrandMark M4 (sin Shield / card-escudo). Auth API intacta.
 */
export function PlatformLoginPage() {
  return (
    <OpsThemeProvider>
      <PlatformLoginPageInner />
    </OpsThemeProvider>
  );
}

function PlatformLoginPageInner() {
  const { resolved } = useOpsTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldSummary, setShowFieldSummary] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(
    null,
  );

  const locationState = location.state as {
    from?: { pathname: string };
    sessionExpired?: boolean;
  } | null;
  const from = locationState?.from?.pathname || "/platform";
  const sessionExpired = locationState?.sessionExpired === true;

  const loginForm = useForm<PlatformLoginFormData, unknown, PlatformLoginFormData>({
    resolver: zodResolver(platformLoginSchema) as Resolver<PlatformLoginFormData>,
    defaultValues: { email: "", password: "" },
  });

  const mfaForm = useForm<PlatformMfaCodeFormData>({
    resolver: zodResolver(platformMfaCodeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (platformTokenStorage.hasSession()) {
      navigate("/platform", { replace: true });
    }
  }, [navigate]);

  const loginFieldSummaryMessages = [
    loginForm.formState.errors.email?.message,
    loginForm.formState.errors.password?.message,
  ].filter((m): m is string => Boolean(m));

  const mfaFieldSummaryMessages = [
    mfaForm.formState.errors.code?.message,
  ].filter((m): m is string => Boolean(m));

  const persistSession = (session: {
    accessToken: string;
    refreshToken: string;
    user: Parameters<typeof platformTokenStorage.setUser>[0];
  }) => {
    platformTokenStorage.setToken(session.accessToken);
    platformTokenStorage.setRefreshToken(session.refreshToken);
    platformTokenStorage.setUser(session.user);
    markPlatformFreshLoginSession();
    navigate(from, { replace: true });
  };

  const onSubmit = loginForm.handleSubmit(
    async (data) => {
      setError(null);
      setShowFieldSummary(false);
      setIsSubmitting(true);
      try {
        const response = await platformApi.login(data);
        if (isPlatformMfaChallenge(response)) {
          setMfaChallengeToken(response.mfaChallengeToken);
          setShowFieldSummary(false);
          mfaForm.reset({ code: "" });
          return;
        }
        persistSession(response);
      } catch (err: unknown) {
        const mapped = mapBackendError(err);
        setError(mapped.message || platformCopy.login.errors.invalidCredentials);
      } finally {
        setIsSubmitting(false);
      }
    },
    () => setShowFieldSummary(true),
  );

  const onMfaSubmit = mfaForm.handleSubmit(
    async (values) => {
      if (!mfaChallengeToken) return;
      setError(null);
      setShowFieldSummary(false);
      setIsSubmitting(true);
      try {
        const response = await platformApi.verifyMfaLogin({
          mfaChallengeToken,
          code: values.code.trim(),
        });
        persistSession(response);
      } catch (err: unknown) {
        const mapped = mapBackendError(err);
        setError(mapped.message || platformCopy.login.mfa.invalidCode);
      } finally {
        setIsSubmitting(false);
      }
    },
    () => setShowFieldSummary(true),
  );

  return (
    <div
      className="platform-ops flex min-h-screen items-center justify-center ops-bg p-6"
      data-ops-login="true"
      data-ops-theme={resolved}
      data-testid="platform-ops-login"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <OpsBrandMark size="hero" className="justify-center self-center" />
        <OpsPanel className="w-full">
          <OpsPanelHeader className="space-y-2 text-center">
            <div className="space-y-1">
              <OpsPanelTitle className="ops-type-h1">
                {mfaChallengeToken
                  ? platformCopy.login.mfa.title
                  : platformCopy.login.title}
              </OpsPanelTitle>
              <p className="ops-type-caption ops-text-muted">
                {platformCopy.brand.subtitle}
              </p>
            </div>
            <OpsPanelDescription>
              {mfaChallengeToken
                ? platformCopy.login.mfa.description
                : platformCopy.login.description}
            </OpsPanelDescription>
          </OpsPanelHeader>
          <OpsPanelBody>
          {sessionExpired && !mfaChallengeToken ? (
            <OpsAlert tone="warn" className="mb-4" title="Sesión">
              {platformCopy.login.errors.sessionExpired}
            </OpsAlert>
          ) : null}
          {error ? (
            <OpsAlert tone="danger" className="mb-4" title="Error">
              {error}
            </OpsAlert>
          ) : null}

          {mfaChallengeToken ? (
            <form onSubmit={onMfaSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="mfa-code" className="ops-label">
                  {platformCopy.login.mfa.codeLabel}
                </label>
                <OpsInput
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...mfaForm.register("code")}
                  {...getRegisterFieldErrorProps(
                    "mfa-code",
                    mfaForm.formState.errors.code?.message,
                  )}
                  error={Boolean(mfaForm.formState.errors.code?.message)}
                />
                <FieldInlineError
                  fieldId="mfa-code"
                  message={mfaForm.formState.errors.code?.message}
                />
              </div>
              {showFieldSummary && mfaFieldSummaryMessages.length > 0 ? (
                <FormValidationSummary
                  title={platformCopy.login.mfa.validationSummaryTitle}
                  messages={mfaFieldSummaryMessages}
                />
              ) : null}
              <OpsButton
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? platformCopy.login.mfa.submitting
                  : platformCopy.login.mfa.submit}
              </OpsButton>
              <OpsButton
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => {
                  setMfaChallengeToken(null);
                  setError(null);
                  setShowFieldSummary(false);
                }}
              >
                {platformCopy.login.mfa.back}
              </OpsButton>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="ops-label">
                  {platformCopy.login.emailLabel}
                </label>
                <OpsInput
                  id="email"
                  type="email"
                  autoComplete="username"
                  {...loginForm.register("email")}
                  {...getRegisterFieldErrorProps(
                    "email",
                    loginForm.formState.errors.email?.message,
                  )}
                  error={Boolean(loginForm.formState.errors.email?.message)}
                />
                <FieldInlineError
                  fieldId="email"
                  message={loginForm.formState.errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="ops-label">
                  {platformCopy.login.passwordLabel}
                </label>
                <div className="relative">
                  <OpsInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...loginForm.register("password")}
                    {...getRegisterFieldErrorProps(
                      "password",
                      loginForm.formState.errors.password?.message,
                    )}
                    error={Boolean(
                      loginForm.formState.errors.password?.message,
                    )}
                  />
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    showLabel={platformCopy.login.showPassword}
                    hideLabel={platformCopy.login.hidePassword}
                  />
                </div>
                <FieldInlineError
                  fieldId="password"
                  message={loginForm.formState.errors.password?.message}
                />
              </div>

              {showFieldSummary && loginFieldSummaryMessages.length > 0 ? (
                <FormValidationSummary
                  title={platformCopy.login.validationSummaryTitle}
                  messages={loginFieldSummaryMessages}
                />
              ) : null}

              <OpsButton
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? platformCopy.login.submitting
                  : platformCopy.login.submit}
              </OpsButton>
            </form>
          )}

          {!mfaChallengeToken ? (
            <p className="mt-6 text-center text-sm ops-text-muted">
              {platformCopy.login.tenantLink}{" "}
              <Link to="/login" className="ops-text-accent hover:underline">
                {platformCopy.login.tenantLinkAction}
              </Link>
            </p>
          ) : null}
          </OpsPanelBody>
        </OpsPanel>
      </div>
    </div>
  );
}
