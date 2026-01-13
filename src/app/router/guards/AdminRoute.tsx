import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@app/providers";

// ============================================
// AdminRoute.tsx
// ============================================

/**
 * AdminRoute
 *
 * Guard que permite acceso solo a administradores.
 * Es un shortcut para RoleRoute con role="admin".
 *
 * @example
 * <AdminRoute>
 *   <AdminSettingsPage />
 * </AdminRoute>
 */
export const AdminRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
