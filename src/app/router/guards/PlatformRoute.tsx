import { Navigate, Outlet, useLocation } from "react-router-dom";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";

/**
 * Guard para rutas `/platform/*` (excepto login).
 * Verifica existencia de sesión platform; la validación real la hace PlatformAuthProvider.
 */
export function PlatformRoute() {
  const location = useLocation();
  const hasSession = platformTokenStorage.hasSession();

  if (!hasSession) {
    return (
      <Navigate to="/platform/login" state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}
