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

/** Evita doble POST /refresh en React Strict Mode (reuse detection). */
let platformBootstrapRefresh: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

function readInitialPlatformAuthState(): PlatformAuthState {
  const token = platformTokenStorage.getToken();
  const user = platformTokenStorage.getUser();
  const refreshToken = platformTokenStorage.getRefreshToken();
  const freshLogin = consumePlatformFreshLoginSession();
  const canRecover = !token && !!refreshToken && !!user;

  return {
    token,
    user,
    isAuthenticated: platformTokenStorage.hasSession(),
    isLoading: (!!token && !freshLogin) || canRecover,
  };
}

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<PlatformAuthState>(
    readInitialPlatformAuthState,
  );

  const handleLogout = useCallback(
    (options?: { sessionExpired?: boolean }) => {
      platformBootstrapRefresh = null;
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

  // Access ausente pero refresh+user vivos → renovar sesión.
  useEffect(() => {
    if (state.token) {
      return;
    }

    const refreshToken = platformTokenStorage.getRefreshToken();
    const user = platformTokenStorage.getUser();
    if (!refreshToken || !user) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }));
      return;
    }

    let cancelled = false;
    if (!platformBootstrapRefresh) {
      platformBootstrapRefresh = platformApi
        .refresh(refreshToken)
        .then((tokens) => {
          platformBootstrapRefresh = null;
          return tokens;
        })
        .catch((err: unknown) => {
          platformBootstrapRefresh = null;
          throw err;
        });
    }

    void platformBootstrapRefresh
      .then((tokens) => {
        if (cancelled) return;
        platformTokenStorage.setToken(tokens.accessToken);
        platformTokenStorage.setRefreshToken(tokens.refreshToken);
        setState({
          token: tokens.accessToken,
          user,
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
  }, [state.token, handleLogout]);

  useEffect(() => {
    if (!state.token || state.user) {
      if (!state.token) {
        return;
      }
      setState((prev) =>
        prev.isLoading ? { ...prev, isLoading: false } : prev,
      );
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
