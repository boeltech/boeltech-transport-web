import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Truck, Mail, ArrowLeft, CheckCircle } from "lucide-react";

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
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { apiClient } from "@shared/api";
import { tokenStorage } from "@features/auth/infrastructure";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@features/auth";

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      // No precargar: evita enviar el reset al tenant equivocado.
      subdomain: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/forgot-password", {
        email: data.email,
        subdomain: data.subdomain.toLowerCase(),
      });

      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as
        | { response?: { data?: { error?: string } } }
        | undefined;
      setError(
        apiError?.response?.data?.error || "Error al procesar la solicitud",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de éxito
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Revisa tu correo</h2>
              <p className="mb-2 text-muted-foreground">
                Si el email existe en nuestro sistema, recibirás instrucciones
                para restablecer tu contraseña. Revisa también spam o
                promociones.
              </p>
              {import.meta.env.DEV ? (
                <p className="mb-6 text-sm text-muted-foreground">
                  En desarrollo: si no llega el correo, revisa los logs de la
                  API (Brevo / IPs autorizadas).
                </p>
              ) : (
                <div className="mb-6" />
              )}
              <Link to="/login">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Truck className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Boeltech ERP</h1>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos instrucciones
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <AlertWithIcon variant="destructive" className="mb-6">
              {error}
            </AlertWithIcon>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Subdomain */}
            <div className="space-y-2">
              <Label htmlFor="subdomain">Empresa</Label>
              <Input
                id="subdomain"
                type="text"
                placeholder="mi-empresa"
                autoComplete="organization"
                {...register("subdomain")}
                {...getRegisterFieldErrorProps(
                  "subdomain",
                  errors.subdomain?.message,
                )}
              />
              <p className="text-xs text-muted-foreground">
                Debe coincidir con el código de empresa del login (no el nombre
                comercial).
              </p>
              {savedSubdomain ? (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    setValue("subdomain", savedSubdomain, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  Usar empresa: {savedSubdomain}
                </button>
              ) : null}
              <FieldInlineError
                fieldId="subdomain"
                message={errors.subdomain?.message}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-10"
                  {...register("email")}
                  {...getRegisterFieldErrorProps("email", errors.email?.message)}
                />
              </div>
              <FieldInlineError fieldId="email" message={errors.email?.message} />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
            </Button>
          </form>

          {/* Link back */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Volver al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
