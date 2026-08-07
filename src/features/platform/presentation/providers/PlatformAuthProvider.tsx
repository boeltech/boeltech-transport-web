/* eslint-disable react-refresh/only-export-components -- provider + hooks co-located */
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
import { isPlatformMfaChallenge, platformQueryKeys } from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";
import {
  consumePlatformFreshLoginSession,
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "../../infrastructure/platformTokenStorage";
import { setPlatformUnauthorizedHandler } from "../../infrastructure/platformSessionHandlers";
import { clearTenantSessionForPlatformBoundary } from "../../infrastructure/clearTenantSessionBoundary";

interface PlatformAuthState {
  user: PlatformUserJSON | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface PlatformAuthContextValue extends PlatformAuthState {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
      void clearTenantSessionForPlatformBoundary();
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
    let cancelled = false;

    if (!refreshToken || !user) {
      // Defer setState to a microtask so it is not sync in the effect body.
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      });
      return () => {
        cancelled = true;
      };
    }

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
    if (!state.token) {
      return;
    }

    const needsProfile =
      !state.user || state.user.mfaEnabled === undefined;
    let cancelled = false;

    if (!needsProfile) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setState((prev) =>
          prev.isLoading ? { ...prev, isLoading: false } : prev,
        );
      });
      return () => {
        cancelled = true;
      };
    }

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
      await clearTenantSessionForPlatformBoundary();

      const response = await platformApi.login(credentials);
      if (isPlatformMfaChallenge(response)) {
        throw new Error("MFA_REQUIRED");
      }
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

  const logout = useCallback(async () => {
    const refreshToken = platformTokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await platformApi.logout(refreshToken);
      } catch {
        // Best-effort server revoke.
      }
    }
    handleLogout();
  }, [handleLogout]);

  const refreshUser = useCallback(async () => {
    const profile = await platformApi.getProfile();
    platformTokenStorage.setUser(profile);
    setState((prev) => ({
      ...prev,
      user: profile,
      isAuthenticated: true,
      isLoading: false,
    }));
  }, []);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
    }),
    [state, login, logout, refreshUser],
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
