import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { invitationsApi } from "../../infrastructure/invitationsApi";
import { useVerifyInvitation } from "../../application/hooks/useVerifyInvitation";
import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormData,
} from "../validation/acceptInvitationSchema";
import { mapBackendError } from "@shared/utils/errorMapper";
import { ROLE_LABELS } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";
import { AuthFunnelFormHeader } from "@pages/auth/AuthFunnelFormHeader";

type PageState = "loading" | "valid" | "invalid" | "success";

/**
 * Aceptar invitación: token en query `?token=` (mismo patrón que reset-password).
 */
export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const {
    isLoading: isVerifying,
    isMissingToken,
    isValid,
    data: verifyData,
    errorMessage: verifyErrorMessage,
  } = useVerifyInvitation(token);

  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcceptInvitationFormData, unknown, AcceptInvitationFormData>({
    resolver: zodResolver(
      acceptInvitationFormSchema,
    ) as Resolver<AcceptInvitationFormData>,
  });

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

  const tokenError =
    verifyErrorMessage || "No se proporcionó un enlace válido";

  const onSubmit = async (form: AcceptInvitationFormData) => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const acceptResult = await invitationsApi.accept({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      setIsSuccess(true);

      const sub = acceptResult.data.tenantSubdomain;
      const emailHint = verifyData?.email ?? "";

      setTimeout(() => {
        navigate(
          {
            pathname: "/login",
            search: sub ? `?subdomain=${encodeURIComponent(sub)}` : "",
          },
          {
            replace: true,
            state: {
              fromInvite: true,
              inviteEmail: emailHint,
            },
          },
        );
      }, 1600);
    } catch (err: unknown) {
      setError(mapBackendError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="flex w-full flex-col items-center gap-3 py-8">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <p className="text-muted-foreground text-sm">Validando invitación…</p>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <div className="bg-destructive/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <AlertCircle className="text-destructive h-8 w-8" />
        </div>
        <AuthFunnelFormHeader
          title="Invitación no disponible"
          description={tokenError}
        />
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/login">Ir al inicio de sesión</Link>
        </Button>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <CheckCircle className="text-primary h-8 w-8" />
        </div>
        <AuthFunnelFormHeader
          title="Listo"
          description="Tu cuenta fue creada. Te llevamos al inicio de sesión…"
        />
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tenantName = verifyData?.tenantName;
  const email = verifyData?.email;
  const role = verifyData?.role as UserRole | undefined;

  return (
    <div className="w-full">
      <AuthFunnelFormHeader
        title="Aceptar invitación"
        description={
          tenantName
            ? `Te invitaron a ${tenantName}. Completa tus datos y define una contraseña.`
            : "Completa tus datos y define una contraseña."
        }
      />

      {email && (
        <div className="bg-muted/50 mb-6 flex items-start gap-2 rounded-lg border p-3 text-sm">
          <Mail className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{email}</p>
            {role && (
              <p className="text-muted-foreground">
                Rol: {ROLE_LABELS[role] ?? role}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="Eliane"
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
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Méndez"
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
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
              {...getRegisterFieldErrorProps(
                "password",
                errors.password?.message,
              )}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FieldInlineError
            fieldId="password"
            message={errors.password?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              {...register("confirmPassword")}
              {...getRegisterFieldErrorProps(
                "confirmPassword",
                errors.confirmPassword?.message,
              )}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"
              }
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FieldInlineError
            fieldId="confirmPassword"
            message={errors.confirmPassword?.message}
          />
        </div>

        {error && (
          <AlertWithIcon
            variant="destructive"
            title="No se pudo crear la cuenta"
          >
            {error}
          </AlertWithIcon>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta y continuar"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
