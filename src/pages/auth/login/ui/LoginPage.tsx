import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Truck, LogIn, Building2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";

import { loginSchema, type LoginFormData } from "@features/auth/model/schemas";
import { authApi } from "@features/auth/api/authApi";
import { tokenStorage } from "@features/auth/lib/tokenStorage";

/**
 * LoginPage
 *
 * Página de inicio de sesión para sistema multi-tenant.
 * Requiere: email, password y subdomain (empresa).
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado local
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener la ruta a la que redirigir después del login
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  // Recuperar subdomain guardado (si existe)
  const savedSubdomain = tokenStorage.getSubdomain() || "";

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      subdomain: savedSubdomain,
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  // Handler del submit
  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Llamar a la API de login
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        subdomain: data.subdomain.toLowerCase(),
      });

      // Guardar tokens
      tokenStorage.setToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setUser(response.user);

      // Guardar subdomain para recordar la empresa
      tokenStorage.setSubdomain(data.subdomain.toLowerCase());

      // Navegar al dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMessage = err?.response?.data?.error;

      if (status === 401) {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else if (status === 403) {
        setError(
          errorMessage ||
            "Tu cuenta o empresa está inactiva. Contacta al administrador."
        );
      } else if (status === 404) {
        setError("Empresa no encontrada. Verifica el identificador.");
      } else if (status === 429) {
        setError(
          "Demasiados intentos. Espera unos minutos e intenta de nuevo."
        );
      } else if (err?.code === "ERR_NETWORK" || !navigator.onLine) {
        setError("Error de conexión. Verifica tu conexión a internet.");
      } else {
        setError(
          errorMessage || "Ocurrió un error inesperado. Intenta de nuevo."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Logo y título */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Truck className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Boeltech ERP</h1>
        <p className="text-sm text-muted-foreground">
          Sistema de Gestión de Transporte
        </p>
      </div>

      {/* Card de login */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Mensaje de error */}
          {error && (
            <AlertWithIcon variant="destructive" className="mb-6">
              {error}
            </AlertWithIcon>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Subdomain (Empresa) */}
            <div className="space-y-2">
              <Label htmlFor="subdomain">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subdomain"
                  type="text"
                  placeholder="mi-empresa"
                  autoComplete="organization"
                  error={!!errors.subdomain}
                  className="pl-10"
                  {...register("subdomain")}
                />
              </div>
              {errors.subdomain ? (
                <p className="text-sm text-destructive">
                  {errors.subdomain.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Identificador de tu empresa (ej: demo, mi-empresa)
                </p>
              )}
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={!!errors.password}
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox Recordarme */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setValue("rememberMe", checked as boolean)
                }
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                Recordarme en este dispositivo
              </Label>
            </div>

            {/* Botón Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {!isSubmitting && <LogIn className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Credenciales de prueba (solo desarrollo) */}
          {import.meta.env.DEV && (
            <div className="mt-6 rounded-lg border border-dashed p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Credenciales de prueba:
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Empresa:</strong> demo
                </p>
                <p>
                  <strong>Email:</strong> admin@boeltech.com
                </p>
                <p>
                  <strong>Password:</strong> Admin123!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Necesitas ayuda?{" "}
        <a
          href="mailto:soporte@boeltech.com"
          className="text-primary hover:underline"
        >
          Contactar soporte
        </a>
      </p>

      {/* Link para volver a landing */}
      <Link
        to="/welcome"
        className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
};

export default LoginPage;
