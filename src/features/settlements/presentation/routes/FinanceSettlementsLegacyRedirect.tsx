import { Navigate, useLocation } from "react-router-dom";
import { resolveLegacySettlementsPath } from "@features/settlements/application/settlementsRoutes";

/**
 * Redirige `/finance/settlements/*` → `/finance/operator-payments/*` (preserva query).
 */
export function FinanceSettlementsLegacyRedirect() {
  const { pathname, search } = useLocation();
  const target = resolveLegacySettlementsPath(pathname, search);
  return <Navigate to={target} replace />;
}
