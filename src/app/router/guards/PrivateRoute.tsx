/**
 * PrivateRoute
 *
 * Guard optimista de routing: comprueba un *marker* de sesión en storage
 * (`tokenStorage.hasSession`), no la validez del access token ni la cookie HttpOnly.
 *
 * Flujo real de privilegios:
 * 1. PrivateRoute: si no hay marker → /login
 * 2. AppLayout monta AuthProvider, que verifica /auth/profile (isLoading spinner)
 * 3. Solo tras verify exitoso se renderizan rutas sensibles
 *
 * En modo cookies, `hasSession` se basa en `erp_user` (forjable en el cliente);
 * AuthProvider es la autoridad: logout si el profile falla.
 *
 * Ubicación: src/app/router/guards/PrivateRoute.tsx
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStorage } from "@/features/auth";

/**
 * PrivateRoute
 *
 * Flujo:
 * 1. Verifica marker de sesión en storage (no valida JWT/cookie)
 * 2. Si hay marker → Outlet (AuthProvider verifica de verdad)
 * 3. Si no hay marker → redirige a login guardando ubicación actual
 */
export function PrivateRoute() {
  const location = useLocation();

  const hasSessionMarker = tokenStorage.hasSession();

  if (!hasSessionMarker) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
