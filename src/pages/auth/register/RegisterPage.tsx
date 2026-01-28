import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  Eye,
  EyeOff,
  Building2,
  // User,
  Mail,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

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
import { apiClient } from "@shared/api";
import { tokenStorage } from "@features/auth/infrastructure";
import { registerSchema, type RegisterFormData } from "@features/auth";

// Schema de validación

type Step = "company" | "admin" | "confirm";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(
    null,
  );
  const [subdomainSuggestion, setSubdomainSuggestion] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const watchSubdomain = watch("subdomain");
  const watchAcceptTerms = watch("acceptTerms");

  // Verificar disponibilidad del subdomain
  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      const response = await apiClient.get<{
        available: boolean;
        subdomain: string;
        suggestion?: string;
      }>(`/onboarding/check-subdomain?subdomain=${subdomain}`);

      setSubdomainAvailable(response.available);
      setSubdomainSuggestion(response.suggestion || null);
    } catch (err) {
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  // Debounce para verificar subdomain
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setValue("subdomain", value);

    // Debounce
    const timeoutId = setTimeout(() => {
      checkSubdomain(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Navegar entre pasos
  const goToStep = async (newStep: Step) => {
    if (newStep === "admin" && step === "company") {
      const isValid = await trigger(["companyName", "subdomain"]);
      if (!isValid || subdomainAvailable === false) return;
    }
    if (newStep === "confirm" && step === "admin") {
      const isValid = await trigger([
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
      ]);
      if (!isValid) return;
    }
    setStep(newStep);
  };

  // Submit
  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>("/onboarding/register", {
        company: {
          name: data.companyName,
          subdomain: data.subdomain,
        },
        admin: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        acceptTerms: data.acceptTerms,
      });

      // Guardar tokens
      tokenStorage.setToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setUser(response.user);
      tokenStorage.setSubdomain(data.subdomain);

      // Ir al dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error || "Error al registrar la empresa";
      setError(errorMsg);

      // Si es error de subdomain, volver al paso 1
      if (
        errorMsg.includes("identificador") ||
        errorMsg.includes("subdomain")
      ) {
        setStep("company");
        if (err?.response?.data?.suggestion) {
          setSubdomainSuggestion(err.response.data.suggestion);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 py-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Truck className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Boeltech ERP</h1>
        <p className="text-sm text-muted-foreground">Crear cuenta de empresa</p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {(["company", "admin", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < ["company", "admin", "confirm"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < ["company", "admin", "confirm"].indexOf(step) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`mx-2 h-0.5 w-8 ${
                  i < ["company", "admin", "confirm"].indexOf(step)
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === "company" && "Datos de la Empresa"}
            {step === "admin" && "Administrador"}
            {step === "confirm" && "Confirmar Registro"}
          </CardTitle>
          <CardDescription>
            {step === "company" && "Información de tu empresa"}
            {step === "admin" && "Datos del usuario administrador"}
            {step === "confirm" && "Revisa y confirma los datos"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <AlertWithIcon variant="destructive" className="mb-6">
              {error}
            </AlertWithIcon>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Company */}
            {step === "company" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Mi Empresa de Transporte"
                      className="pl-10"
                      error={!!errors.companyName}
                      {...register("companyName")}
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Identificador único</Label>
                  <div className="relative">
                    <Input
                      id="subdomain"
                      placeholder="mi-empresa"
                      error={!!errors.subdomain || subdomainAvailable === false}
                      {...register("subdomain")}
                      onChange={handleSubdomainChange}
                    />
                    {isCheckingSubdomain && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === true && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {errors.subdomain && (
                    <p className="text-sm text-destructive">
                      {errors.subdomain.message}
                    </p>
                  )}
                  {subdomainAvailable === false && (
                    <p className="text-sm text-destructive">
                      Este identificador no está disponible.
                      {subdomainSuggestion && (
                        <button
                          type="button"
                          className="ml-1 text-primary underline"
                          onClick={() => {
                            setValue("subdomain", subdomainSuggestion);
                            checkSubdomain(subdomainSuggestion);
                          }}
                        >
                          Usar {subdomainSuggestion}
                        </button>
                      )}
                    </p>
                  )}
                  {subdomainAvailable === true && (
                    <p className="text-sm text-green-600">✓ Disponible</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Este será tu identificador para iniciar sesión
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => goToStep("admin")}
                  disabled={!watchSubdomain || subdomainAvailable === false}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {/* Step 2: Admin */}
            {step === "admin" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      error={!!errors.firstName}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      error={!!errors.lastName}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      error={!!errors.password}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      error={!!errors.confirmPassword}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("company")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => goToStep("confirm")}
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <>
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{watch("companyName")}</p>
                    <p className="text-sm text-muted-foreground">
                      {watch("subdomain")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Administrador
                    </p>
                    <p className="font-medium">
                      {watch("firstName")} {watch("lastName")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {watch("email")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={watchAcceptTerms}
                    onCheckedChange={(checked) =>
                      setValue("acceptTerms", checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Acepto los términos y condiciones
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Al registrarte aceptas nuestros{" "}
                      <a
                        href="/terms"
                        className="text-primary underline"
                        target="_blank"
                      >
                        términos de servicio
                      </a>{" "}
                      y{" "}
                      <a
                        href="/privacy"
                        className="text-primary underline"
                        target="_blank"
                      >
                        política de privacidad
                      </a>
                    </p>
                  </div>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">
                    {errors.acceptTerms.message}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("admin")}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || !watchAcceptTerms}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? "Creando..." : "Crear cuenta"}
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Link to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
