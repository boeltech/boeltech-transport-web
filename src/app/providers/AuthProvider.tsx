import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import type { AuthState, User } from "@features/auth/model/types";
import { tokenStorage } from "@features/auth/lib/tokenStorage";
import { authApi } from "@features/auth/api/authApi";
import { apiClient } from "@shared/api";

// ============================================
// Tipos del Contexto
// ============================================

interface LoginParams {
  email: string;
  password: string;
  subdomain: string;
}

interface AuthContextType extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

// ============================================
// Contexto
// ============================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Refs globales para los callbacks de interceptores
// Esto permite configurar interceptores antes del render
// ============================================
const authCallbacks = {
  onUnauthorized: () => {
    console.log("[Auth] Unauthorized callback not set yet");
  },
  onForbidden: () => {
    console.log("[Auth] Forbidden callback not set yet");
  },
};

// ============================================
// Configurar interceptores INMEDIATAMENTE (fuera de React)
// Esto se ejecuta cuando el módulo se importa
// ============================================
apiClient.configureInterceptors({
  getToken: () => tokenStorage.getToken(),
  getRefreshToken: () => tokenStorage.getRefreshToken(),
  setToken: (token: string) => {
    console.log("[Auth] Token refreshed successfully");
    tokenStorage.setToken(token);
  },
  removeToken: () => tokenStorage.removeToken(),
  clear: () => tokenStorage.clear(),
  onUnauthorized: () => authCallbacks.onUnauthorized(),
  onForbidden: () => authCallbacks.onForbidden(),
});

console.log("[Auth] Interceptors configured at module load");

// ============================================
// Provider
// ============================================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ============================================
  // Estado inicial desde localStorage
  // ============================================
  const [state, setState] = useState<AuthState>(() => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser();

    return {
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading: !!token, // Si hay token, verificar validez
    };
  });

  // ============================================
  // Logout
  // ============================================
  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenStorage.clear();
      queryClient.clear();

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  // ============================================
  // Actualizar callbacks globales cuando cambien las dependencias
  // ============================================
  useEffect(() => {
    authCallbacks.onUnauthorized = () => {
      console.log("[Auth] Executing unauthorized callback");
      logout();
    };

    authCallbacks.onForbidden = () => {
      console.log("[Auth] Executing forbidden callback");
      navigate("/forbidden");
    };
  }, [logout, navigate]);

  // ============================================
  // Verificar token al cargar la app
  // ============================================
  useEffect(() => {
    const verifyAuth = async () => {
      const token = tokenStorage.getToken();

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        console.log("[Auth] Verifying token...");
        const user = await authApi.getProfile();
        console.log("[Auth] Token valid, user:", user.email);

        tokenStorage.setUser(user);

        setState({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error: any) {
        console.error("[Auth] Token verification failed:", error?.message);

        // Si llegamos aquí, el interceptor no pudo hacer refresh
        // o el refresh también falló
        if (tokenStorage.getToken()) {
          tokenStorage.clear();
        }

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
  }, [state.isLoading]);

  // ============================================
  // Login
  // ============================================
  const login = useCallback(async (params: LoginParams) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.login({
        email: params.email,
        password: params.password,
        subdomain: params.subdomain,
      });

      tokenStorage.setToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setUser(response.user);
      tokenStorage.setSubdomain(params.subdomain);

      setState({
        token: response.accessToken,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // ============================================
  // Verificación de Permisos
  // ============================================
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;

      const userPermissions = (state.user as User & { permissions?: string[] })
        .permissions;

      if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
      }

      return userPermissions.some((p) => {
        if (p === permission) return true;
        if (p.endsWith(":*")) {
          const prefix = p.slice(0, -1);
          return permission.startsWith(prefix);
        }
        return false;
      });
    },
    [state.user]
  );

  // ============================================
  // Verificación de Roles
  // ============================================
  const hasRole = useCallback(
    (roles: string | string[]): boolean => {
      if (!state.user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(state.user.role);
    },
    [state.user]
  );

  // ============================================
  // Memoizar valor del contexto
  // ============================================
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [state, login, logout, hasPermission, hasRole]
  );

  // ============================================
  // Render
  // ============================================
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
};

// ============================================
// Hook para consumir el contexto
// ============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export { AuthContext };
