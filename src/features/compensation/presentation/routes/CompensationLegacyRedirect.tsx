import { Navigate, useLocation } from "react-router-dom";
import { resolveLegacyCompensationPath } from "../../application/compensationRoutes";

/**
 * Redirige `/finance/compensation/*` → `/finance/operator-payments/tariffs/*` (preserva query).
 */
export function CompensationLegacyRedirect() {
  const { pathname, search } = useLocation();
  const target = resolveLegacyCompensationPath(pathname, search);
  return <Navigate to={target} replace />;
}
