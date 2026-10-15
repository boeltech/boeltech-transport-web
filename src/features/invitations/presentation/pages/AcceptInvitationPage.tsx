import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
  PasswordRequirementsList,
} from "@shared/ui/form";
import { invitationsApi } from "../../infrastructure/invitationsApi";
import { useVerifyInvitation } from "../../application/hooks/useVerifyInvitation";
import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormData,
} from "../validation/acceptInvitationSchema";
import { acceptInvitationCopy as copy } from "../copy/acceptInvitationCopy";
import { mapBackendError } from "@shared/utils/errorMapper";
import { ROLE_LABELS } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";
import { AuthFunnelFormHeader } from "@pages/auth/AuthFunnelFormHeader";
import { AuthFunnelStatusBlock } from "@pages/auth/AuthFunnelStatusBlock";
import { PasswordVisibilityToggle } from "@pages/auth/PasswordVisibilityToggle";
import { authFunnelCopy } from "@pages/auth/authFunnelCopy";

type PageState = "loading" | "valid" | "invalid" | "success";

/**
 * Aceptar invitación: token en query `?token=` (mismo patrón que reset-password).
 * F1 Operate: StatusBlock en loading/error/success; sin auto-redirect a login.
 */
export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    isLoading: isVerifying,
    isMissingToken,
    isValid,
    data: verifyData,
    errorMessage: verifyErrorMessage,
  } = useVerifyInvitation(token);

  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedSubdomain, setAcceptedSubdomain] = useState<string | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldSummary, setShowFieldSummary] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AcceptInvitationFormData, unknown, AcceptInvitationFormData>({
    resolver: zodResolver(
      acceptInvitationFormSchema,
    ) as Resolver<AcceptInvitationFormData>,
  });

  const watchPassword = watch("password") ?? "";

  const fieldSummaryMessages = [
    errors.firstName?.message,
    errors.lastName?.message,
    errors.password?.message,
    errors.confirmPassword?.message,
  ].filter((m): m is string => Boolean(m));

  useEffect(() => {
    if (!verifyData?.valid) return;
    reset({
      password: "",
      confirmPassword: "",
      firstName: verifyData.firstName?.trim() || "",
      lastName: verifyData.lastName?.trim() || "",
    });
  }, [verifyData, reset]);

  const pageState: PageState = isSuccess
    ? "success"
    : isMissingToken || Boolean(verifyErrorMessage)
      ? "invalid"
      : isVerifying
        ? "loading"
        : isValid
          ? "valid"
          : "loading";

  const tokenError = isMissingToken
    ? copy.invalid.missingToken
    : verifyErrorMessage || copy.invalid.missingToken;

  const onSubmit = async (form: AcceptInvitationFormData) => {
    if (!token) return;
    setError(null);
    setShowFieldSummary(false);
    setIsSubmitting(true);

    try {
      const acceptResult = await invitationsApi.accept({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      setAcceptedSubdomain(acceptResult.data.tenantSubdomain ?? null);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(mapBackendError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <AuthFunnelStatusBlock variant="loading" loadingLabel={copy.loading} />
    );
  }

  if (pageState === "invalid") {
    return (
      <AuthFunnelStatusBlock
        variant="error"
        icon={<AlertCircle className="h-8 w-8" aria-hidden />}
        title={copy.invalid.title}
        description={tokenError}
      >
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/login">{copy.invalid.goLogin}</Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  if (pageState === "success") {
    const sub = acceptedSubdomain ?? "";
    const loginSearch = sub
      ? `?subdomain=${encodeURIComponent(sub)}`
      : "";
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={copy.success.title}
        description={copy.success.body}
      >
        <Button asChild size="lg" className="w-full">
          <Link to={{ pathname: "/login", search: loginSearch }}>
            {copy.success.goLogin}
          </Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  const tenantName = verifyData?.tenantName;
  const email = verifyData?.email;
  const role = verifyData?.role as UserRole | undefined;

  return (
    <div className="w-full">
      <AuthFunnelFormHeader
        title={copy.title}
        description={
          tenantName
            ? copy.descriptionWithTenant(tenantName)
            : copy.descriptionFallback
        }
      />

      {email ? (
        <div className="bg-muted/50 mb-6 flex items-start gap-2 rounded-lg border p-3 text-sm">
          <Mail className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{email}</p>
            {role ? (
              <p className="text-muted-foreground">
                {copy.fields.rolePrefix} {ROLE_LABELS[role] ?? role}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <AlertWithIcon
          variant="destructive"
          title={copy.submitErrorTitle}
          className="mb-6"
        >
          {error}
        </AlertWithIcon>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit, () => setShowFieldSummary(true))}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">{copy.fields.firstName}</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder={copy.fields.firstNamePlaceholder}
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
            <Label htmlFor="lastName">{copy.fields.lastName}</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder={copy.fields.lastNamePlaceholder}
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
          <Label htmlFor="password">{copy.fields.password}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={copy.fields.passwordPlaceholder}
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
            {copy.fields.confirmPassword}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder={copy.fields.confirmPasswordPlaceholder}
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

        {showFieldSummary && fieldSummaryMessages.length > 0 ? (
          <FormValidationSummary
            title={copy.validationSummaryTitle}
            messages={fieldSummaryMessages}
          />
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? copy.submitting : copy.submit}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          {copy.backToLogin}
        </Link>
      </div>
    </div>
  );
}
