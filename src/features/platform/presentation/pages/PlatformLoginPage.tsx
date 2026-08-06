import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
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
import { FieldInlineError, getRegisterFieldErrorProps } from "@shared/ui/form";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "../../infrastructure/platformTokenStorage";
import { clearTenantSessionForPlatformBoundary } from "../../infrastructure/clearTenantSessionBoundary";
import { platformApi } from "../../infrastructure/platformApi";
import { isPlatformMfaChallenge } from "../../domain/entities";
import {
  platformLoginSchema,
  platformMfaCodeSchema,
  type PlatformLoginFormData,
  type PlatformMfaCodeFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";

export function PlatformLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const onSubmit = loginForm.handleSubmit(async (data) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await clearTenantSessionForPlatformBoundary();
      const response = await platformApi.login(data);
      if (isPlatformMfaChallenge(response)) {
        setMfaChallengeToken(response.mfaChallengeToken);
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
  });

  const onMfaSubmit = mfaForm.handleSubmit(async (values) => {
    if (!mfaChallengeToken) return;
    setError(null);
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
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/40 to-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden
          >
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle>
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
                    "code",
                    mfaForm.formState.errors.code?.message,
                  )}
                />
                <FieldInlineError
                  fieldId="code"
                  message={mfaForm.formState.errors.code?.message}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
                    {...loginForm.register("password")}
                    {...getRegisterFieldErrorProps(
                      "password",
                      loginForm.formState.errors.password?.message,
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FieldInlineError
                  fieldId="password"
                  message={loginForm.formState.errors.password?.message}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
