import { Navigate, useLocation } from "react-router-dom";
import { resolveLegacyAgreementsPath } from "../../application/compensationRoutes";

/** Redirect legacy /finance/agreements → hub plantillas ADR-0089. */
export function AgreementsLegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={resolveLegacyAgreementsPath(search)} replace />;
}
