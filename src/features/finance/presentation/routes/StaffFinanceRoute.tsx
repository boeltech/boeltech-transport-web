import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@features/auth";
import { isClientPortalRole } from "@shared/constants/roles";

/** Excluye portal client de rutas staff de Finanzas (redirige a facturas). */
export function StaffFinanceRoute() {
  const { user } = useAuth();

  if (isClientPortalRole(user?.role)) {
    return <Navigate to="/finance/invoices" replace />;
  }

  return <Outlet />;
}
