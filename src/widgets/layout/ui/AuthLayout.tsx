import { Outlet } from "react-router-dom";
import { QueryProvider } from "@app/providers/QueryProvider";
import { ThemeProvider } from "@app/providers/ThemeProvider";
import { ToastProvider } from "@app/providers/ToastProvider";
import { Toaster } from "@shared/ui/toast";

// ============================================
// AuthLayout (para páginas de login, etc.)
// ============================================

/**
 * AuthLayout
 *
 * Layout minimalista para páginas de autenticación.
 * Solo incluye Theme y Toast para feedback visual.
 *
 * NO incluye AuthProvider porque:
 * 1. Las páginas de auth no necesitan el contexto de usuario autenticado
 * 2. LoginPage maneja la autenticación directamente con authApi
 * 3. Una sola instancia de AuthProvider (en AppLayout) = Single Source of Truth
 */
const AuthLayout = () => {
  return (
    <QueryProvider>
      <ThemeProvider defaultMode="system">
        <ToastProvider>
          <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
            <div className="w-full max-w-md p-6">
              <Outlet />
            </div>
          </div>
          <Toaster />
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default AuthLayout;
