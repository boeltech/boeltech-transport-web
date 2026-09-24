import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
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
import { PlatformBrandMark } from "../layout/PlatformBrandMark";

export function PlatformLoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/40 to-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <PlatformBrandMark
              compact
              iconClassName="h-12 w-12 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">
              {mfaChallengeToken
                ? platformCopy.login.mfa.title
                : platformCopy.login.title}
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {platformCopy.brand.subtitle}
            </p>
          </div>
          <CardDescription>
            {mfaChallengeToken
              ? platformCopy.login.mfa.description
              : platformCopy.login.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionExpired && !mfaChallengeToken ? (
            <AlertWithIcon variant="warning" className="mb-4">
              {platformCopy.login.errors.sessionExpired}
            </AlertWithIcon>
          ) : null}
          {error ? (
            <AlertWithIcon variant="destructive" className="mb-4">
              {error}
            </AlertWithIcon>
          ) : null}

          {mfaChallengeToken ? (
            <form onSubmit={onMfaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">
                  {platformCopy.login.mfa.codeLabel}
                </Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...mfaForm.register("code")}
                  {...getRegisterFieldErrorProps(
                    "mfa-code",
                    mfaForm.formState.errors.code?.message,
                  )}
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
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting
                  ? platformCopy.login.mfa.submitting
                  : platformCopy.login.mfa.submit}
              </Button>
              <Button
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
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{platformCopy.login.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  {...loginForm.register("email")}
                  {...getRegisterFieldErrorProps(
                    "email",
                    loginForm.formState.errors.email?.message,
                  )}
                />
                <FieldInlineError
                  fieldId="email"
                  message={loginForm.formState.errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {platformCopy.login.passwordLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...loginForm.register("password")}
                    {...getRegisterFieldErrorProps(
                      "password",
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

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting
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
  );
}
