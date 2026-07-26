import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";

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
import { apiClient } from "@shared/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@features/auth";
import { mapBackendError } from "@shared/utils/errorMapper";
import { AuthFunnelFormHeader } from "../AuthFunnelFormHeader";
import { AuthFunnelStatusBlock } from "../AuthFunnelStatusBlock";
import { PasswordVisibilityToggle } from "../PasswordVisibilityToggle";
import { authFunnelCopy } from "../authFunnelCopy";
import { resetPasswordCopy as copy } from "./resetPasswordCopy";
import { useVerifyResetToken } from "./useVerifyResetToken";

type PageState = "loading" | "valid" | "invalid" | "success";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    isLoading: isVerifyingToken,
    isMissingToken,
    result: tokenResult,
    errorMessage: verifyErrorMessage,
  } = useVerifyResetToken(token);

  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldSummary, setShowFieldSummary] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchPassword = watch("password") ?? "";

  const fieldSummaryMessages = [
    errors.password?.message,
    errors.confirmPassword?.message,
  ].filter((m): m is string => Boolean(m));

  const pageState: PageState = isSuccess
    ? "success"
    : isMissingToken || Boolean(verifyErrorMessage)
      ? "invalid"
      : isVerifyingToken
        ? "loading"
        : tokenResult?.valid
          ? "valid"
          : "loading";

  const tokenError = isMissingToken
    ? copy.invalid.missingToken
    : verifyErrorMessage || copy.invalid.fallbackError;

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setShowFieldSummary(false);
    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

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
        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link to="/forgot-password">{copy.invalid.requestNew}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/login">{copy.invalid.backToLogin}</Link>
          </Button>
        </div>
      </AuthFunnelStatusBlock>
    );
  }

  if (pageState === "success") {
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={copy.success.title}
        description={copy.success.body}
      >
        <Button asChild size="lg" className="w-full">
          <Link to="/login">{copy.success.goLogin}</Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  return (
    <div className="w-full">
      <AuthFunnelFormHeader title={copy.title} description={copy.description} />

      {error && (
        <AlertWithIcon variant="destructive" className="mb-6">
          {error}
        </AlertWithIcon>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, () => setShowFieldSummary(true))}
        className="space-y-4"
      >
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
    </div>
  );
};

export default ResetPasswordPage;
