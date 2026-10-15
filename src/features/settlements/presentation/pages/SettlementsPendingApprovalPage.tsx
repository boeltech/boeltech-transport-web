import { Navigate, useLocation } from "react-router-dom";
import { settlementsPendingApprovalRedirectPath } from "../config/settlementWorkbenchConfig";

/**
 * Redirect legacy del tab «Por autorizar» → bucket En autorización del workbench.
 * El módulo Finanzas › Aprobaciones sigue siendo la bandeja transversal.
 */
export function SettlementsPendingApprovalPage() {
  const { search } = useLocation();
  return (
    <Navigate to={settlementsPendingApprovalRedirectPath(search)} replace />
  );
}
