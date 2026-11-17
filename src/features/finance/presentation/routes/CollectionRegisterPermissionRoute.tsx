/**
 * Acceso al form único: finance.create (con factura) u operational_cash.create (sin).
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@shared/permissions";

export function CollectionRegisterPermissionRoute() {
  const { hasPermission, isLoading, isAuthenticated } = usePermissions();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const canRegister =
    hasPermission("finance", "create") ||
    hasPermission("operational_cash", "create");

  if (!canRegister) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
