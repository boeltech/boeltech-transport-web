import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

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
import { apiClient } from "@shared/api";
import { tokenStorage } from "@features/auth/infrastructure";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@features/auth";
import { mapBackendError } from "@shared/utils/errorMapper";
import { AuthFunnelFormHeader } from "../AuthFunnelFormHeader";
import { AuthFunnelStatusBlock } from "../AuthFunnelStatusBlock";
import { authFunnelCopy } from "../authFunnelCopy";
import { forgotPasswordCopy as copy } from "./forgotPasswordCopy";

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [showFieldSummary, setShowFieldSummary] = useState(false);

  const savedSubdomain = tokenStorage.getSubdomain()?.trim() || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      subdomain: "",
    },
  });

  const fieldSummaryMessages = [
    errors.subdomain?.message,
    errors.email?.message,
  ].filter((m): m is string => Boolean(m));

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setShowFieldSummary(false);

    if (isTurnstileConfigured() && !captchaToken) {
      setError(authFunnelCopy.captchaRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/forgot-password", {
        email: data.email,
        subdomain: data.subdomain.toLowerCase(),
        ...(captchaToken ? { captchaToken } : {}),
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError(mapBackendError(err).message);
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={copy.success.title}
        description={
          <>
            {copy.success.body}
            {import.meta.env.DEV ? (
              <span className="mt-2 block text-sm">{copy.success.devHint}</span>
            ) : null}
          </>
        }
      >
        <Button asChild size="lg" className="w-full">
          <Link to="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.backToLogin}
          </Link>
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
          <Label htmlFor="subdomain">{copy.fields.subdomain}</Label>
          <Input
            id="subdomain"
            type="text"
            placeholder={copy.fields.subdomainPlaceholder}
            autoComplete="organization"
            {...register("subdomain")}
            {...getRegisterFieldErrorProps(
              "subdomain",
              errors.subdomain?.message,
            )}
          />
          <p className="text-muted-foreground text-sm">
            {copy.fields.subdomainHint}
          </p>
          {savedSubdomain ? (
            <button
              type="button"
              className="text-primary text-xs hover:underline"
              onClick={() =>
                setValue("subdomain", savedSubdomain, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              {copy.fields.useSavedSubdomain(savedSubdomain)}
            </button>
          ) : null}
          <FieldInlineError
            fieldId="subdomain"
            message={errors.subdomain?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{copy.fields.email}</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={copy.fields.emailPlaceholder}
              className="pl-10"
              {...register("email")}
              {...getRegisterFieldErrorProps("email", errors.email?.message)}
            />
          </div>
          <FieldInlineError fieldId="email" message={errors.email?.message} />
        </div>

        <TurnstileWidget
          ref={turnstileRef}
          onToken={setCaptchaToken}
          className="flex justify-center"
        />

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
};

export default ForgotPasswordPage;
