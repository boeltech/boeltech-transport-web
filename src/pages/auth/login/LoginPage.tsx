import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Truck, LogIn, Building2 } from "lucide-react";

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

import { authApi, tokenStorage } from "@features/auth/infrastructure";
import { loginSchema, type LoginFormData } from "@features/auth";
import { mapBackendError } from "@shared/utils/errorMapper";

/**
 * LoginPage
 *
 * Página de inicio de sesión para sistema multi-tenant.
 * NO usa useAuth() porque está fuera del AuthProvider.
 * Llama directamente a authApi y guarda tokens.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Estado local
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener la ruta a la que redirigir después del login
  const locationState =
    location.state as { from?: { pathname: string }; sessionExpired?: boolean } | null;

  const from = locationState?.from?.pathname || "/dashboard";

  const sessionExpired = locationState?.sessionExpired === true;

  const inviteEmail =
    (location.state as { inviteEmail?: string } | null)?.inviteEmail ?? "";

  // Recuperar subdomain guardado o desde query (p. ej. post /accept-invitation)
  const savedSubdomain = tokenStorage.getSubdomain() || "";
  const subdomainFromQuery = searchParams.get("subdomain")?.trim() || "";

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData, unknown, LoginFormData>({
    resolver: zodResolver(loginSchema) as Resolver<LoginFormData>,
    defaultValues: {
      email: "",
      password: "",
      subdomain: savedSubdomain,
    },
  });

  useEffect(() => {
    reset({
      email: inviteEmail,
      password: "",
      subdomain: subdomainFromQuery || savedSubdomain,
    });
  }, [inviteEmail, subdomainFromQuery, savedSubdomain, reset]);

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

      // Guardar tokens y datos
      tokenStorage.setToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setUser(response.user);
      tokenStorage.setSubdomain(data.subdomain.toLowerCase());

      if (response.user.onboardingCompletedAt == null) {
        navigate("/onboarding", { replace: true });
        return;
      }

      navigate(from, { replace: true });
    } catch (err: unknown) {
      const mapped = mapBackendError(err);
      let message = mapped.message;
      if (!navigator.onLine) {
        message = "Error de conexión. Verifica tu internet.";
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Logo */}
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
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sessionExpired && (
            <AlertWithIcon variant="default" className="mb-6">
              Tu sesión expiró o dejó de ser válida (por ejemplo: token de acceso
              caducado o sesión cerrada en el servidor). Vuelve a iniciar sesión
              para continuar.
            </AlertWithIcon>
          )}

          {/* Mensaje de error */}
          {error && (
            <AlertWithIcon variant="destructive" className="mb-6">
              {error}
            </AlertWithIcon>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Subdomain */}
            <div className="space-y-2">
              <Label htmlFor="subdomain">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="subdomain"
                  type="text"
                  placeholder="mi-empresa"
                  autoComplete="organization"
                  className="pl-10"
                  {...register("subdomain")}
                  {...getRegisterFieldErrorProps(
                    "subdomain",
                    errors.subdomain?.message,
                  )}
                />
              </div>
              <FieldInlineError
                fieldId="subdomain"
                message={errors.subdomain?.message}
              />
              {!errors.subdomain && (
                <p className="text-xs text-muted-foreground">
                  Identificador de tu empresa
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
                {...register("email")}
                {...getRegisterFieldErrorProps("email", errors.email?.message)}
              />
              <FieldInlineError fieldId="email" message={errors.email?.message} />
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
                  className="pr-10"
                  {...register("password")}
                  {...getRegisterFieldErrorProps(
                    "password",
                    errors.password?.message,
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  tabIndex={-1}
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

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Registra tu empresa
              </Link>
            </p>
          </div>
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
