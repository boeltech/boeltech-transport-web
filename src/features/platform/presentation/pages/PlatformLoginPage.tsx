import { useEffect, useState, type BaseSyntheticEvent } from "react";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
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
  OpsFieldError,
  OpsFormErrors,
  OpsInput,
  OpsLabel,
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../ops/ui";
import { OpsThemeProvider, useOpsTheme } from "../ops/OpsThemeProvider";
import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { PlatformBrandMark } from "../layout/PlatformBrandMark";
import { usePlatformDocumentChrome } from "../layout/usePlatformDocumentChrome";
import "../ops/opsTokens.css";

/**
 * Puerta de `/platform/login`. El mismo flag que PlatformShell:
 * off → marca PlatformBrandMark, sin piel Ops; on → login Ops.
 * Arriba de la tarjeta hay un solo nombre de consola.
 */
export function PlatformLoginPage() {
  usePlatformDocumentChrome();

  if (!isPlatformConsoleV1Enabled()) {
    return <PlatformLoginClassic />;
  }

  return (
    <OpsThemeProvider>
      <PlatformLoginOps />
    </OpsThemeProvider>
  );
}

type LoginController = {
  showPassword: boolean;
  togglePassword: () => void;
  isSubmitting: boolean;
  error: string | null;
  showFieldSummary: boolean;
  mfaChallengeToken: string | null;
  sessionExpired: boolean;
  loginForm: UseFormReturn<PlatformLoginFormData>;
  mfaForm: UseFormReturn<PlatformMfaCodeFormData>;
  loginFieldSummaryMessages: string[];
  mfaFieldSummaryMessages: string[];
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onMfaSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  leaveMfa: () => void;
};

function usePlatformLoginController(): LoginController {
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

  return {
    showPassword,
    togglePassword: () => setShowPassword((value) => !value),
    isSubmitting,
    error,
    showFieldSummary,
    mfaChallengeToken,
    sessionExpired,
    loginForm,
    mfaForm,
    loginFieldSummaryMessages,
    mfaFieldSummaryMessages,
    onSubmit,
    onMfaSubmit,
    leaveMfa: () => {
      setMfaChallengeToken(null);
      setError(null);
      setShowFieldSummary(false);
    },
  };
}

function PlatformLoginOps() {
  const { resolved } = useOpsTheme();
  const login = usePlatformLoginController();
  const { mfaChallengeToken } = login;

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
            <OpsPanelTitle className="ops-type-h1">
              {mfaChallengeToken
                ? platformCopy.login.mfa.title
                : platformCopy.brand.subtitle}
            </OpsPanelTitle>
            <OpsPanelDescription>
              {mfaChallengeToken
                ? platformCopy.login.mfa.description
                : platformCopy.login.description}
            </OpsPanelDescription>
          </OpsPanelHeader>
          <OpsPanelBody>
          {login.sessionExpired && !mfaChallengeToken ? (
            <OpsAlert tone="warn" className="mb-4" title="Sesión">
              {platformCopy.login.errors.sessionExpired}
            </OpsAlert>
          ) : null}
          {login.error ? (
            <OpsAlert tone="danger" className="mb-4" title="Error">
              {login.error}
            </OpsAlert>
          ) : null}

          {mfaChallengeToken ? (
            <form onSubmit={login.onMfaSubmit} className="space-y-4">
              <div className="space-y-2">
                <OpsLabel htmlFor="mfa-code">
                  {platformCopy.login.mfa.codeLabel}
                </OpsLabel>
                <OpsInput
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...login.mfaForm.register("code")}
                  {...getRegisterFieldErrorProps(
                    "mfa-code",
                    login.mfaForm.formState.errors.code?.message,
                  )}
                  error={Boolean(login.mfaForm.formState.errors.code?.message)}
                />
                <OpsFieldError
                  fieldId="mfa-code"
                  message={login.mfaForm.formState.errors.code?.message}
                />
              </div>
              {login.showFieldSummary && login.mfaFieldSummaryMessages.length > 0 ? (
                <OpsFormErrors
                  title={platformCopy.login.mfa.validationSummaryTitle}
                  messages={login.mfaFieldSummaryMessages}
                />
              ) : null}
              <OpsButton
                type="submit"
                className="w-full"
                disabled={login.isSubmitting}
              >
                {login.isSubmitting
                  ? platformCopy.login.mfa.submitting
                  : platformCopy.login.mfa.submit}
              </OpsButton>
              <OpsButton
                type="button"
                variant="ghost"
                className="w-full"
                disabled={login.isSubmitting}
                onClick={login.leaveMfa}
              >
                {platformCopy.login.mfa.back}
              </OpsButton>
            </form>
          ) : (
            <form onSubmit={login.onSubmit} className="space-y-4">
              <div className="space-y-2">
                <OpsLabel htmlFor="email">
                  {platformCopy.login.emailLabel}
                </OpsLabel>
                <OpsInput
                  id="email"
                  type="email"
                  autoComplete="username"
                  {...login.loginForm.register("email")}
                  {...getRegisterFieldErrorProps(
                    "email",
                    login.loginForm.formState.errors.email?.message,
                  )}
                  error={Boolean(login.loginForm.formState.errors.email?.message)}
                />
                <OpsFieldError
                  fieldId="email"
                  message={login.loginForm.formState.errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <OpsLabel htmlFor="password">
                  {platformCopy.login.passwordLabel}
                </OpsLabel>
                <div className="relative">
                  <OpsInput
                    id="password"
                    type={login.showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...login.loginForm.register("password")}
                    {...getRegisterFieldErrorProps(
                      "password",
                      login.loginForm.formState.errors.password?.message,
                    )}
                    error={Boolean(
                      login.loginForm.formState.errors.password?.message,
                    )}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 ops-rounded ops-text-muted ops-ring-accent p-0.5"
                    aria-label={
                      login.showPassword
                        ? platformCopy.login.hidePassword
                        : platformCopy.login.showPassword
                    }
                    onClick={login.togglePassword}
                  >
                    {login.showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                <OpsFieldError
                  fieldId="password"
                  message={login.loginForm.formState.errors.password?.message}
                />
              </div>

              {login.showFieldSummary && login.loginFieldSummaryMessages.length > 0 ? (
                <OpsFormErrors
                  title={platformCopy.login.validationSummaryTitle}
                  messages={login.loginFieldSummaryMessages}
                />
              ) : null}

              <OpsButton
                type="submit"
                className="w-full"
                disabled={login.isSubmitting}
              >
                {login.isSubmitting
                  ? platformCopy.login.submitting
                  : platformCopy.login.submit}
              </OpsButton>
            </form>
          )}

          {!mfaChallengeToken ? (
            <p className="mt-6 text-center ops-type-caption ops-text-muted">
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

function PlatformLoginClassic() {
  const login = usePlatformLoginController();
  const { mfaChallengeToken } = login;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      data-testid="platform-login"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <PlatformBrandMark className="justify-center self-center" />
        <Card className="w-full">
          <CardHeader className="text-center">
            {mfaChallengeToken ? (
              <CardTitle>{platformCopy.login.mfa.title}</CardTitle>
            ) : null}
            <CardDescription>
              {mfaChallengeToken
                ? platformCopy.login.mfa.description
                : platformCopy.login.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {login.sessionExpired && !mfaChallengeToken ? (
              <AlertWithIcon variant="warning" title="Sesión" className="mb-4">
                {platformCopy.login.errors.sessionExpired}
              </AlertWithIcon>
            ) : null}
            {login.error ? (
              <AlertWithIcon variant="destructive" title="Error" className="mb-4">
                {login.error}
              </AlertWithIcon>
            ) : null}

            {mfaChallengeToken ? (
              <form onSubmit={login.onMfaSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">
                    {platformCopy.login.mfa.codeLabel}
                  </Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    {...login.mfaForm.register("code")}
                    {...getRegisterFieldErrorProps(
                      "mfa-code",
                      login.mfaForm.formState.errors.code?.message,
                    )}
                    error={Boolean(login.mfaForm.formState.errors.code?.message)}
                  />
                  <FieldInlineError
                    fieldId="mfa-code"
                    message={login.mfaForm.formState.errors.code?.message}
                  />
                </div>
                {login.showFieldSummary && login.mfaFieldSummaryMessages.length > 0 ? (
                  <FormValidationSummary
                    title={platformCopy.login.mfa.validationSummaryTitle}
                    messages={login.mfaFieldSummaryMessages}
                  />
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={login.isSubmitting}
                >
                  {login.isSubmitting
                    ? platformCopy.login.mfa.submitting
                    : platformCopy.login.mfa.submit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={login.isSubmitting}
                  onClick={login.leaveMfa}
                >
                  {platformCopy.login.mfa.back}
                </Button>
              </form>
            ) : (
              <form onSubmit={login.onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{platformCopy.login.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    {...login.loginForm.register("email")}
                    {...getRegisterFieldErrorProps(
                      "email",
                      login.loginForm.formState.errors.email?.message,
                    )}
                    error={Boolean(
                      login.loginForm.formState.errors.email?.message,
                    )}
                  />
                  <FieldInlineError
                    fieldId="email"
                    message={login.loginForm.formState.errors.email?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {platformCopy.login.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={login.showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                      {...login.loginForm.register("password")}
                      {...getRegisterFieldErrorProps(
                        "password",
                        login.loginForm.formState.errors.password?.message,
                      )}
                      error={Boolean(
                        login.loginForm.formState.errors.password?.message,
                      )}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={
                        login.showPassword
                          ? platformCopy.login.hidePassword
                          : platformCopy.login.showPassword
                      }
                      onClick={login.togglePassword}
                    >
                      {login.showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <FieldInlineError
                    fieldId="password"
                    message={login.loginForm.formState.errors.password?.message}
                  />
                </div>

                {login.showFieldSummary &&
                login.loginFieldSummaryMessages.length > 0 ? (
                  <FormValidationSummary
                    title={platformCopy.login.validationSummaryTitle}
                    messages={login.loginFieldSummaryMessages}
                  />
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={login.isSubmitting}
                >
                  {login.isSubmitting
                    ? platformCopy.login.submitting
                    : platformCopy.login.submit}
                </Button>
              </form>
            )}

            {!mfaChallengeToken ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {platformCopy.login.tenantLink}{" "}
                <Link to="/login" className="text-primary hover:underline">
                  {platformCopy.login.tenantLinkAction}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
