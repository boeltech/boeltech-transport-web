/**
 * AuthProvider
 * Clean Architecture - UI Layer
 *
 * Provider de autenticación que integra:
 * - Casos de uso de auth (login, logout, verify)
 * - Interceptores de Axios
 * - Sistema de permisos
 *
 * Ubicación: src/features/auth/ui/AuthProvider.tsx
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/shared/api";

// Domain
import { User, Tenant, type AuthState, type LoginCredentials } from "../domain";

// Application
import { LoginUseCase, LogoutUseCase, VerifyAuthUseCase } from "../application";

// Infrastructure
import {
  AuthRepository,
  tokenStorage,
  setupAuthInterceptor,
} from "../infrastructure";

// ============================================
// CONTEXT TYPE
// ============================================

export interface AuthContextType extends AuthState {
  /** Iniciar sesión */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Cerrar sesión */
  logout: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

export const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ==========================================
  // Inicializar casos de uso (DI)
  // ==========================================
  const authRepository = useMemo(() => new AuthRepository(), []);

  const loginUseCase = useMemo(
    () => new LoginUseCase(authRepository, tokenStorage),
    [authRepository],
  );

  const logoutUseCase = useMemo(
    () => new LogoutUseCase(authRepository, tokenStorage),
    [authRepository],
  );

  const verifyAuthUseCase = useMemo(
    () => new VerifyAuthUseCase(authRepository, tokenStorage),
    [authRepository],
  );

  // ==========================================
  // Estado inicial desde localStorage
  // ==========================================
  const [state, setState] = useState<AuthState>(() => {
    const token = tokenStorage.getToken();
    const userData = tokenStorage.getUser();

    let user: User | null = null;
    if (userData) {
      try {
        user = User.fromJSON(userData);
      } catch (error) {
        console.error(
          "[AuthProvider] Error recreating user from storage:",
          error,
        );
        tokenStorage.clear();
      }
    }

    return {
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading: !!token, // Si hay token, necesitamos verificarlo
    };
  });

  // ==========================================
  // Logout Handler
  // ==========================================
  const handleLogout = useCallback(async () => {
    console.log("[AuthProvider] Logging out...");

    // Ejecutar caso de uso de logout
    await logoutUseCase.execute();

    // Limpiar cache de React Query
    queryClient.clear();

    // Actualizar estado
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Redirigir a login
    navigate("/login", { replace: true });
  }, [logoutUseCase, queryClient, navigate]);

  // ==========================================
  // Configurar interceptores (una sola vez)
  // ==========================================
  useEffect(() => {
    setupAuthInterceptor(apiClient.getAxiosInstance(), {
      onUnauthorized: () => {
        console.log("[AuthProvider] Unauthorized - logging out");
        handleLogout();
      },
      onForbidden: () => {
        console.log("[AuthProvider] Forbidden - redirecting");
        navigate("/forbidden");
      },
      onTokenRefreshed: (newToken) => {
        console.log("[AuthProvider] Token refreshed");
        setState((prev) => ({ ...prev, token: newToken }));
      },
    });
  }, [handleLogout, navigate]);

  // ==========================================
  // Verificar token al cargar la app
  // ==========================================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await verifyAuthUseCase.execute();

        if (user) {
          setState({
            token: tokenStorage.getToken(),
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("[AuthProvider] Verification failed:", error);
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    if (state.isLoading) {
      verifyAuth();
    }
  }, [state.isLoading, verifyAuthUseCase]);

  // ==========================================
  // Login
  // ==========================================
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const { user, accessToken } = await loginUseCase.execute(credentials);

        setState({
          token: accessToken.toString(),
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [loginUseCase],
  );

  // ==========================================
  // Valor del contexto
  // ==========================================
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout: handleLogout,
    }),
    [state, login, handleLogout],
  );

  // ==========================================
  // Loading Screen
  // ==========================================
  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
