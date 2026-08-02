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
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

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

// Infrastructure — leaf imports (no barrel) para no ciclar con hooks/AuthContext
import { AuthRepository } from "../../infrastructure/repositories/AuthRepository";
import {
  tokenStorage,
  consumeFreshLoginSession,
} from "../../infrastructure/storage/tokenStorage";
import {
  setTenantUnauthorizedHandler,
  setTenantTokenRefreshedHandler,
} from "../../infrastructure/sessionHandlers";
import {
  persistsAuthTokens,
  usesAuthCookies,
} from "../../infrastructure/sessionMode";
import { clearSentryUser, setSentryUser } from "@/shared/observability/sentry";
import { AuthContext, type AuthContextType } from "./authContext";

export type { AuthContextType };
export { AuthContext };

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
    const freshLogin = consumeFreshLoginSession();

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

    const cookieSession =
      usesAuthCookies() && !persistsAuthTokens() && (!!user || freshLogin);
    const bearerSession = !!token && !!user;

    return {
      token,
      user,
      isAuthenticated: bearerSession || cookieSession,
      isLoading: (bearerSession || cookieSession) && !freshLogin,
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
  // Handlers de sesión tenant (interceptores en AxiosAuthSetup / App)
  // ==========================================
  useEffect(() => {
    setTenantUnauthorizedHandler(() => {
      console.log("[AuthProvider] Unauthorized — ending session");
      void handleLogout({ sessionExpired: true });
    });
    setTenantTokenRefreshedHandler((newToken) => {
      console.log("[AuthProvider] Token refreshed");
      setState((prev) => ({ ...prev, token: newToken }));
    });

    return () => {
      setTenantUnauthorizedHandler(() => {});
      setTenantTokenRefreshedHandler(() => {});
    };
  }, [handleLogout]);

  useEffect(() => {
    if (state.user) {
      setSentryUser({
        id: state.user.id,
        tenantId: state.user.tenant.id,
        role: state.user.role,
      });
      return;
    }

    if (!state.isLoading) {
      clearSentryUser();
    }
  }, [state.user, state.isLoading]);

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
      const cookieOnly = usesAuthCookies() && !persistsAuthTokens();

      if (cookieOnly) {
        if (!userJson) {
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
            token: null,
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
        return;
      }

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
          await handleLogout({ sessionExpired: true });
        }
      } catch (error) {
        console.error("[AuthProvider] Verification failed:", error);
        await handleLogout({ sessionExpired: true });
      }
    };

    if (state.isLoading) {
      verifyAuth();
    }
  }, [state.isLoading, verifyAuthUseCase, handleLogout]);

  // ==========================================
  // Login
  // ==========================================
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const { user, accessToken } = await loginUseCase.execute(credentials);

        setState({
          token: accessToken?.toString() ?? null,
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
    if (persistsAuthTokens() && !tokenStorage.getToken()) {
      return;
    }
    if (!persistsAuthTokens() && !tokenStorage.getUser() && !usesAuthCookies()) {
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
      if (accessToken && persistsAuthTokens()) {
        tokenStorage.setToken(accessToken);
      }
      setState((prev) => ({
        ...prev,
        token:
          accessToken && persistsAuthTokens()
            ? accessToken
            : persistsAuthTokens()
              ? prev.token
              : null,
        user,
        isAuthenticated: true,
      }));
    },
    [],
  );

  const applySessionTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      if (!persistsAuthTokens()) {
        setState((prev) => ({
          ...prev,
          token: null,
          isAuthenticated: true,
        }));
        return;
      }
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

  // Provider siempre montado: evita "useAuth must be used within an AuthProvider"
  // si algún hijo (p. ej. tras login/logout) renderiza durante la verificación inicial.
  return (
    <AuthContext.Provider value={value}>
      {state.isLoading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Verificando sesión...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
