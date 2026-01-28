/**
 * useAuth Hook (Re-export)
 *
 * Re-exporta useAuth desde el feature de auth para uso en shared.
 * Esto permite que otros módulos importen desde @/shared/hooks/useAuth
 *
 * Ubicación: src/shared/hooks/useAuth.ts
 */

export {
  useAuth,
  useRequireAuth,
  useCurrentUser,
  useIsAuthenticated,
  useAuthLoading,
} from "@/features/auth";
export type { AuthContextType } from "@/features/auth";
