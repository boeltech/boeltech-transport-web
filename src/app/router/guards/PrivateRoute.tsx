import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStorage } from "@features/auth/lib/tokenStorage";

/**
 * PrivateRoute
 *
 * Guard que protege rutas que requieren autenticación.
 *
 * IMPORTANTE: Este componente NO usa useAuth() porque se ejecuta
 * ANTES de que AppLayout (y por ende AuthProvider) se monte.
 *
 * En su lugar, verifica directamente si existe un token en storage.
 * La validación real del token la hace AuthProvider cuando se monte.
 *
 * Flujo:
 * 1. PrivateRoute verifica si hay token
 * 2. Si hay token → renderiza Outlet (que incluye AppLayout)
 * 3. AppLayout monta AuthProvider
 * 4. AuthProvider valida el token con el backend
 * 5. Si el token es inválido, AuthProvider hace logout
 */
export const PrivateRoute = () => {
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
};
