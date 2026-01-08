// src/features/auth/view/Login/Login.jsx

import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLogin } from "@features/auth/viewModel/useLogin";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

// Schema de validación
const loginSchema = yup.object({
  email: yup.string().email("Email inválido").required("Email es requerido"),
  password: yup
    .string()
    .min(6, "Mínimo 6 caracteres")
    .required("Contraseña es requerida"),
});

export const Login = () => {
  const { login, isLoading } = useLogin();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setError(null);

    const result = await login(data.email, data.password);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ERP Transporte
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Inicia sesión en tu cuenta
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error general */}
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              {/* <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="usuario@ejemplo.com"
                disabled={isLoading}
              /> */}
              <Input
                id="email"
                type="email"
                {...register("email")}
                
                placeholder="usuario@ejemplo.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Credentials de prueba */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">
              💡 Credenciales de prueba:
            </p>
            <div className="bg-muted/50 p-3 rounded-md space-y-2 text-xs">
              <div>
                <p className="font-medium">Administrador:</p>
                <p>admin@transporte.com / admin123</p>
              </div>
              <div>
                <p className="font-medium">Gerente:</p>
                <p>gerente@transporte.com / gerente123</p>
              </div>
              <div>
                <p className="font-medium">Operador:</p>
                <p>operador@transporte.com / operador123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// {
//     "email": "admin@boeltech.com",
//     "password": "Admin123!",
//     "subdomain": "demo"
// }
