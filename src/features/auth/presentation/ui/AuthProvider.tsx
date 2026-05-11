/* eslint-disable react-refresh/only-export-components */
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
import {
  User,
  type AuthState,
  type LoginCredentials,
  type UserJSON,
} from "../../domain";

// Application
import {
  LoginUseCase,
  LogoutUseCase,
  VerifyAuthUseCase,
} from "../../application";

// Infrastructure
import {
  AuthRepository,
  tokenStorage,
  setupAuthInterceptor,
} from "../../infrastructure";

// ============================================
// CONTEXT TYPE
// ============================================

export interface AuthContextType extends AuthState {
  /** Iniciar sesión */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Cerrar sesión */
  logout: () => Promise<void>;
  /** Refrescar usuario desde GET /auth/profile (sesión autenticada) */
  refreshProfile: () => Promise<void>;
  /** Sincroniza sesión tras PATCH de perfil; opcionalmente guarda nuevo access token. */
  replaceSessionUser: (json: UserJSON, accessToken?: string) => void;
  /** Persiste access + refresh (p. ej. tras POST /auth/change-password con nuevos tokens). */
  applySessionTokens: (accessToken: string, refreshToken: string) => void;
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
  const SESSION_STORAGE_KEYS = useMemo(
    () => ["erp_access_token", "erp_refresh_token", "erp_user"] as const,
    [],
  );

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
  const handleLogout = useCallback(
    async (options?: { sessionExpired?: boolean }) => {
      console.log("[AuthProvider] Logging out...");

      try {
        await logoutUseCase.execute();
      } catch {
        // Refresh/access inválido: el servidor puede responder 401; igual limpiamos cliente
      }

      queryClient.clear();

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      navigate("/login", {
        replace: true,
        ...(options?.sessionExpired ? { state: { sessionExpired: true } } : {}),
      });
    },
    [logoutUseCase, queryClient, navigate],
  );

  // ==========================================
  // Configurar interceptores (una sola vez)
  // ==========================================
  useEffect(() => {
    const detach = setupAuthInterceptor(apiClient.getAxiosInstance(), {
      onUnauthorized: () => {
        console.log("[AuthProvider] Unauthorized — ending session");
        void handleLogout({ sessionExpired: true });
      },
      onForbidden: () => {
        // 403 puede ser contextual a un recurso. Evitamos redirección global forzada.
        console.log("[AuthProvider] Forbidden - keeping current route");
      },
      onTokenRefreshed: (newToken) => {
        console.log("[AuthProvider] Token refreshed");
        setState((prev) => ({ ...prev, token: newToken }));
      },
    });

    return detach;
  }, [handleLogout, navigate]);

  // ==========================================
  // Sincronizar sesión entre pestañas
  // ==========================================
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || !SESSION_STORAGE_KEYS.includes(event.key as (typeof SESSION_STORAGE_KEYS)[number])) {
        return;
      }

      const token = tokenStorage.getToken();
      const userJson = tokenStorage.getUser();

      if (!token || !userJson) {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      try {
        const user = User.fromJSON(userJson);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        tokenStorage.clear();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [SESSION_STORAGE_KEYS]);

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
          navigate("/login", {
            replace: true,
            state: { sessionExpired: true },
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
        navigate("/login", {
          replace: true,
          state: { sessionExpired: true },
        });
      }
    };

    if (state.isLoading) {
      verifyAuth();
    }
  }, [state.isLoading, verifyAuthUseCase, navigate]);

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
  // Refrescar perfil (autoservicio lectura / post-login)
  // ==========================================
  const refreshProfile = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      return;
    }

    const userData = await authRepository.getProfile();
    const user = User.create({
      ...userData,
      lastLogin: userData.lastLogin,
    });
    tokenStorage.setUser(user.toJSON());
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
  }, [authRepository]);

  const replaceSessionUser = useCallback(
    (json: UserJSON, accessToken?: string) => {
      const user = User.fromJSON(json);
      tokenStorage.setUser(user.toJSON());
      if (accessToken) {
        tokenStorage.setToken(accessToken);
      }
      setState((prev) => ({
        ...prev,
        token: accessToken ?? prev.token,
        user,
        isAuthenticated: true,
      }));
    },
    [],
  );

  const applySessionTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      tokenStorage.setToken(accessToken);
      tokenStorage.setRefreshToken(refreshToken);
      setState((prev) => ({
        ...prev,
        token: accessToken,
        isAuthenticated: true,
      }));
    },
    [],
  );

  // ==========================================
  // Valor del contexto
  // ==========================================
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout: handleLogout,
      refreshProfile,
      replaceSessionUser,
      applySessionTokens,
    }),
    [
      state,
      login,
      handleLogout,
      refreshProfile,
      replaceSessionUser,
      applySessionTokens,
    ],
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
