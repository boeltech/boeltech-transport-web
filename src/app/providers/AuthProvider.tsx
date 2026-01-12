import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthState, LoginCredentials } from "@features/auth/model/types";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage } from "@features/auth/lib/tokenStorage";
import { authApi } from "@features/auth/api/authApi";
import { apiClient } from "@shared/api";

// ============================================
// Tipos del Contexto
// ============================================
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

// ============================================
// Contexto
// ============================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Provider
// ============================================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Aquí iría la lógica de autenticación (estado, funciones, efectos, etc.)

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Estado inicial desde localStorage (persistencia)
  const [state, setState] = useState<AuthState>(() => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser();

    return {
      token,
      user,
      isAuthenticated: !!token && !!user /** (Mejora ChatGpt) false */,
      isLoading: !!token, // Si hay token, verificamos validez
    };
  });

  // ============================================
  // Configurar interceptor de Axios
  // ============================================
  //   useEffect(() => {
  //     // Request interceptor: agregar token a cada request
  //     const requestInterceptor = apiClient.interceptors.request.use(
  //       (config) => {
  //         const token = tokenStorage.getToken();
  //         if (token) {
  //           config.headers.Authorization = `Bearer ${token}`;
  //         }
  //         return config;
  //       },
  //       (error) => Promise.reject(error)
  //     );

  //     // Response interceptor: manejar errores de auth
  //     const responseInterceptor = apiClient.interceptors.response.use(
  //       (response) => response,
  //       async (error) => {
  //         if (error.response?.status === 401) {
  //           // Token expirado o inválido
  //           tokenStorage.clear();
  //           setState({
  //             user: null,
  //             token: null,
  //             isAuthenticated: false,
  //             isLoading: false,
  //           });
  //           navigate('/login', {
  //             state: { from: location.pathname },
  //             replace: true
  //           });
  //         }
  //         return Promise.reject(error);
  //       }
  //     );

  //     // Cleanup
  //     return () => {
  //       apiClient.interceptors.request.eject(requestInterceptor);
  //       apiClient.interceptors.response.eject(responseInterceptor);
  //     };
  //   }, [navigate, location.pathname]);
  useEffect(() => {
    apiClient.configureInterceptors({
      getToken: () => tokenStorage.getToken(),
      removeToken: () => tokenStorage.removeToken(),
      onUnauthorized: () => {
        void logout();
      },
      onForbidden: () => navigate("/forbidden"),
    });
  }, [navigate]);

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
        // Verificar que el token sigue siendo válido
        const user = await authApi.me();

        tokenStorage.setUser(user);
        setState({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Token inválido
        tokenStorage.clear();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        throw error;
      }
    };

    if (state.isLoading) {
      verifyAuth();
    }
  }, [state.isLoading]);

  // ============================================
  // Login
  // ============================================
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const { token, user } = await authApi.login(credentials);

        // Persistir
        tokenStorage.setToken(token);
        tokenStorage.setUser(user);

        // Actualizar estado
        setState({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Redirigir a la página original o dashboard
        const from = location.state?.from || "/dashboard";
        navigate(from, { replace: true });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error; // Re-throw para que el form lo maneje
      }
    },
    [navigate, location.state]
  );

  // ============================================
  // Logout
  // ============================================
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continuar con logout local aunque falle el servidor
      console.error("Logout error:", error);
    } finally {
      // Limpiar todo
      tokenStorage.clear();
      queryClient.clear(); // Limpiar cache de React Query

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
  // Verificación de Permisos
  // ============================================
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!state.user) return false;

      // Admin tiene todos los permisos
      if (state.user.rol === "admin") return true;

      return state.user.permisos.includes(permission);
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
      return roleArray.includes(state.user.rol);
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
  // Mostrar loading mientras verificamos auth inicial
  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
