import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Truck,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
import { invitationsApi } from "../../infrastructure/invitationsApi";
import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormData,
} from "../validation/acceptInvitationSchema";
import { mapBackendError } from "@shared/utils/errorMapper";
import { ROLE_LABELS } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";

type PageState = "loading" | "valid" | "invalid" | "success";

/**
 * Aceptar invitación: token en query `?token=` (mismo patrón que reset-password).
 */
export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [tokenError, setTokenError] = useState("");
  const [verifyMeta, setVerifyMeta] = useState<{
    tenantName?: string;
    email?: string;
    role?: UserRole;
  }>({});
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
    const run = async () => {
      if (!token) {
        setTokenError("No se proporcionó un enlace válido");
        setPageState("invalid");
        return;
      }

      try {
        const data = await invitationsApi.verify(token);
        if (data.valid) {
          setVerifyMeta({
            tenantName: data.tenantName,
            email: data.email,
            role: data.role,
          });
          reset({
            password: "",
            confirmPassword: "",
            firstName: data.firstName?.trim() || "",
            lastName: data.lastName?.trim() || "",
          });
          setPageState("valid");
        } else {
          setTokenError(data.error || "Invitación no disponible");
          setPageState("invalid");
        }
      } catch {
        setTokenError("No se pudo validar la invitación");
        setPageState("invalid");
      }
    };

    void run();
  }, [token, reset]);

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

      setPageState("success");

      const sub = acceptResult.data.tenantSubdomain;
      const emailHint = verifyMeta.email ?? "";

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
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Validando invitación…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Invitación no disponible</CardTitle>
            <CardDescription className="text-center">{tokenError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">¡Listo!</CardTitle>
            <CardDescription className="text-center">
              Tu cuenta fue creada. Te llevamos al inicio de sesión…
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Truck className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-muted-foreground mt-3 text-sm">Boeltech ERP</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceptar invitación</CardTitle>
          <CardDescription>
            {verifyMeta.tenantName ? (
              <>
                Te invitaron a <strong>{verifyMeta.tenantName}</strong>.
                Completa tus datos y define una contraseña.
              </>
            ) : (
              "Completa tus datos y define una contraseña."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifyMeta.email && (
            <div className="bg-muted/50 mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{verifyMeta.email}</p>
                {verifyMeta.role && (
                  <p className="text-muted-foreground">
                    Rol: {ROLE_LABELS[verifyMeta.role] ?? verifyMeta.role}
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
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-destructive text-sm">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-destructive text-sm">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <AlertWithIcon variant="destructive" title="No se pudo crear la cuenta">
                {error}
              </AlertWithIcon>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta…
                </>
              ) : (
                "Crear cuenta y continuar"
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary font-medium underline-offset-4 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
