// src/pages/auth/login/ui/LoginPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Truck, LogIn } from "lucide-react";

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
 * Página de inicio de sesión.
 *
 * NOTA: Esta página NO usa useAuth() porque está fuera del AuthProvider.
 * En su lugar, llama directamente a authApi y guarda el token.
 * Cuando el usuario navegue al dashboard, el AuthProvider
 * detectará el token y cargará la sesión.
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
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  // Handler del submit
  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Llamar directamente a la API de login
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      // Guardar token y datos del usuario
      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user);

      // Si "recordarme" está activo, podríamos guardar el refresh token
      // o marcar una flag para sesión persistente
      if (data.rememberMe && response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }

      // Navegar al dashboard (o a la página que intentaba acceder)
      // El AuthProvider en AppLayout detectará el token y cargará la sesión
      navigate(from, { replace: true });
    } catch (err: any) {
      // Manejar diferentes tipos de errores
      const status = err?.response?.status;

      if (status === 401) {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else if (status === 403) {
        setError("Tu cuenta está inactiva. Contacta al administrador.");
      } else if (status === 423) {
        setError("Tu cuenta está bloqueada. Contacta al administrador.");
      } else if (status === 429) {
        setError(
          "Demasiados intentos. Espera unos minutos e intenta de nuevo."
        );
      } else if (err?.code === "ERR_NETWORK" || !navigator.onLine) {
        setError("Error de conexión. Verifica tu conexión a internet.");
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
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
