/**
 * Auth Hooks
 * Clean Architecture - Infrastructure Layer
 *
 * Hooks de React para autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/hooks/index.ts
 */

import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../ui/AuthProvider";

// ============================================
// useAuth
// ============================================

/**
 * Hook para acceder al contexto de autenticación
 *
 * @throws Error si se usa fuera del AuthProvider
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// ============================================
// useRequireAuth
// ============================================

/**
 * Hook que redirige si el usuario no está autenticado
 *
 * @example
 * function ProtectedPage() {
 *   const { isLoading } = useRequireAuth();
 *   if (isLoading) return <Loading />;
 *   return <Content />;
 * }
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location.pathname]);

  return { isAuthenticated, isLoading };
}

// ============================================
// useCurrentUser
// ============================================

/**
 * Hook para obtener el usuario actual
 *
 * @example
 * const user = useCurrentUser();
 * if (user) console.log(user.getFullName());
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

// ============================================
// useIsAuthenticated
// ============================================

/**
 * Hook para verificar si está autenticado
 *
 * @example
 * const isAuthenticated = useIsAuthenticated();
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// ============================================
// useAuthLoading
// ============================================

/**
 * Hook para obtener el estado de carga de auth
 *
 * @example
 * const isLoading = useAuthLoading();
 */
export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}
