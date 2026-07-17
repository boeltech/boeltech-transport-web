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
import type { PlatformUserJSON } from "../../domain/entities";
import { platformQueryKeys } from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";
import {
  consumePlatformFreshLoginSession,
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "../../infrastructure/platformTokenStorage";
import { setPlatformUnauthorizedHandler } from "../../infrastructure/platformSessionHandlers";

interface PlatformAuthState {
  user: PlatformUserJSON | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface PlatformAuthContextValue extends PlatformAuthState {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<PlatformAuthState>(() => {
    const token = platformTokenStorage.getToken();
    const user = platformTokenStorage.getUser();
    const freshLogin = consumePlatformFreshLoginSession();
    return {
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading: !!token && !freshLogin,
    };
  });

  const handleLogout = useCallback(
    (options?: { sessionExpired?: boolean }) => {
      platformTokenStorage.clear();
      queryClient.removeQueries({ queryKey: platformQueryKeys.all });
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      navigate("/platform/login", {
        replace: true,
        ...(options?.sessionExpired
          ? { state: { sessionExpired: true } }
          : {}),
      });
    },
    [navigate, queryClient],
  );

  useEffect(() => {
    setPlatformUnauthorizedHandler(() => {
      handleLogout({ sessionExpired: true });
    });
    return () => {
      setPlatformUnauthorizedHandler(() => {});
    };
  }, [handleLogout]);

  useEffect(() => {
    if (!state.token || state.user) {
      if (!state.token) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      return;
    }

    let cancelled = false;
    platformApi
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        platformTokenStorage.setUser(profile);
        setState({
          token: platformTokenStorage.getToken(),
          user: profile,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        handleLogout({ sessionExpired: true });
      });

    return () => {
      cancelled = true;
    };
  }, [state.token, state.user, handleLogout]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await platformApi.login(credentials);
      platformTokenStorage.setToken(response.accessToken);
      platformTokenStorage.setRefreshToken(response.refreshToken);
      platformTokenStorage.setUser(response.user);
      markPlatformFreshLoginSession();
      setState({
        token: response.accessToken,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  }
  return context;
}

export function usePlatformLogin() {
  return usePlatformAuth().login;
}
