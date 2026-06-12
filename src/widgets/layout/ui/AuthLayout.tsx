import { Outlet } from "react-router-dom";

// ============================================
// AuthLayout (para páginas de login, etc.)
// ============================================

/**
 * AuthLayout
 *
 * Layout minimalista para páginas de autenticación.
 * Solo incluye el chrome visual; Query/Theme/Toast viven en App.tsx.
 *
 * NO incluye AuthProvider porque:
 * 1. Las páginas de auth no necesitan el contexto de usuario autenticado
 * 2. LoginPage maneja la autenticación directamente con authApi
 * 3. Una sola instancia de AuthProvider (en AppLayout) = Single Source of Truth
 */
const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/40 to-muted">
      <div className="w-full max-w-md p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
