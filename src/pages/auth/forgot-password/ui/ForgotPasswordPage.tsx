import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { z } from "zod";
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
import { apiClient } from "@shared/api";
import { tokenStorage } from "@features/auth/lib/tokenStorage";

// Schema de validación
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingresa un correo electrónico válido"),
  subdomain: z
    .string()
    .min(1, "La empresa es requerida")
    .min(3, "Mínimo 3 caracteres"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const savedSubdomain = tokenStorage.getSubdomain() || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      subdomain: savedSubdomain,
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post("/api/auth/forgot-password", {
        email: data.email,
        subdomain: data.subdomain.toLowerCase(),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al procesar la solicitud");
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
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Revisa tu correo</h2>
              <p className="mb-6 text-muted-foreground">
                Si el email existe en nuestro sistema, recibirás instrucciones
                para restablecer tu contraseña.
              </p>
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
                error={!!errors.subdomain}
                {...register("subdomain")}
              />
              {errors.subdomain && (
                <p className="text-sm text-destructive">
                  {errors.subdomain.message}
                </p>
              )}
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
                  error={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
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
