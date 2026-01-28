/**
 * PrivateRoute
 *
 * Guard que protege rutas que requieren autenticación.
 *
 * IMPORTANTE: Este componente NO usa useAuth() porque se ejecuta
 * ANTES de que los providers se monten completamente.
 *
 * En su lugar, verifica directamente si existe un token en storage.
 * La validación real del token la hace AuthProvider cuando se monte.
 *
 * Ubicación: src/app/router/guards/PrivateRoute.tsx
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStorage } from "@/features/auth";

/**
 * PrivateRoute
 *
 * Flujo:
 * 1. Verifica si hay token en storage
 * 2. Si hay token → renderiza Outlet (children)
 * 3. Si no hay token → redirige a login guardando ubicación actual
 */
export function PrivateRoute() {
  const location = useLocation();

  // Verificar si hay token (no validamos, solo existencia)
  const hasToken = tokenStorage.hasSession();

  if (!hasToken) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay token, permitir acceso
  // AuthProvider validará el token cuando se monte
  return <Outlet />;
}
