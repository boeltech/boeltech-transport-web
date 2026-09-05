import { Navigate, useLocation } from "react-router-dom";
import { resolveLegacySettlementsPath } from "@features/settlements/application/settlementsRoutes";

/**
 * Redirige rutas legacy /settlements/* → /finance/settlements/* (preserva query).
 */
export function SettlementsLegacyRedirect() {
  const { pathname, search } = useLocation();
  const target = resolveLegacySettlementsPath(pathname, search);
  return <Navigate to={target} replace />;
}
