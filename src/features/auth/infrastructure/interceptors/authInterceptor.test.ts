import axios, { type AxiosError, type AxiosInstance } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getRefreshToken,
  getToken,
  getUser,
  clear,
  setToken,
  setRefreshToken,
} = vi.hoisted(() => ({
  getRefreshToken: vi.fn(),
  getToken: vi.fn(),
  getUser: vi.fn(),
  clear: vi.fn(),
  setToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

const {
  platformGetRefreshToken,
  platformGetToken,
  platformSetToken,
  platformSetRefreshToken,
  platformClear,
} = vi.hoisted(() => ({
  platformGetRefreshToken: vi.fn(),
  platformGetToken: vi.fn(),
  platformSetToken: vi.fn(),
  platformSetRefreshToken: vi.fn(),
  platformClear: vi.fn(),
}));

const notifyPlatformUnauthorized = vi.hoisted(() => vi.fn());

vi.mock("../storage/tokenStorage", () => ({
  tokenStorage: {
    getToken,
    getRefreshToken,
    getUser,
    setToken,
    setRefreshToken,
    clear,
  },
}));

vi.mock("../sessionMode", () => ({
  persistsAuthTokens: () => true,
  sendsBearerFromStorage: () => true,
  usesAuthCookies: () => false,
  authSessionMode: "bearer",
}));

vi.mock("@features/platform/infrastructure/platformTokenStorage", () => ({
  platformTokenStorage: {
    getToken: platformGetToken,
    getRefreshToken: platformGetRefreshToken,
    setToken: platformSetToken,
    setRefreshToken: platformSetRefreshToken,
    clear: platformClear,
  },
}));

vi.mock("@features/platform/infrastructure/platformSessionHandlers", () => ({
  notifyPlatformUnauthorized,
}));

import { setupAuthInterceptor } from "./authInterceptor";
import { notifyPlatformUnauthorized as notifyPlatformUnauthorizedImport } from "@features/platform/infrastructure/platformSessionHandlers";

function axios401(
  config: AxiosError["config"],
  data: { error: string; code: string },
): AxiosError {
  const error = new Error("Request failed with status code 401") as AxiosError;
  error.isAxiosError = true;
  error.config = config;
  error.response = {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config: config!,
    data,
  };
  return error;
}

function getAuthorizationHeader(config: {
  headers?: unknown;
}): string {
  const headers = config.headers as
    | { get?: (name: string) => unknown; Authorization?: unknown }
    | undefined;
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return String(headers.get("Authorization") ?? "");
  }
  return String(headers.Authorization ?? "");
}

describe("setupAuthInterceptor public auth 401", () => {
  let instance: AxiosInstance;
  let teardown: () => void;
  const onUnauthorized = vi.fn();
  const onForbidden = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getToken.mockReturnValue(null);
    getRefreshToken.mockReturnValue(null);
    getUser.mockReturnValue(null);
    platformGetToken.mockReturnValue(null);
    platformGetRefreshToken.mockReturnValue(null);
    setToken.mockImplementation((token: string) => {
      getToken.mockReturnValue(token);
    });
    setRefreshToken.mockImplementation((token: string) => {
      getRefreshToken.mockReturnValue(token);
    });
    platformSetToken.mockImplementation((token: string) => {
      platformGetToken.mockReturnValue(token);
    });
    platformSetRefreshToken.mockImplementation((token: string) => {
      platformGetRefreshToken.mockReturnValue(token);
    });
    instance = axios.create();
    teardown = setupAuthInterceptor(instance, {
      onUnauthorized,
      onForbidden,
    });
  });

  afterEach(() => {
    teardown();
  });

  it("rejects login 401 with original body and does not refresh", async () => {
    instance.defaults.adapter = async (config) => {
      throw axios401(config, {
        error: "Credenciales inválidas",
        code: "INVALID_CREDENTIALS",
      });
    };

    await expect(
      instance.post("/auth/login", {
        email: "a@b.com",
        password: "wrong",
        subdomain: "acme",
      }),
    ).rejects.toMatchObject({
      response: {
        status: 401,
        data: {
          code: "INVALID_CREDENTIALS",
          error: "Credenciales inválidas",
        },
      },
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(getRefreshToken).not.toHaveBeenCalled();
  });

  it("does not attempt refresh when there is no refresh token", async () => {
    getToken.mockReturnValue(null);
    getRefreshToken.mockReturnValue(null);

    instance.defaults.adapter = async (config) => {
      throw axios401(config, {
        error: "Token de autenticación no proporcionado",
        code: "TOKEN_MISSING",
      });
    };

    await expect(instance.get("/billing/subscription")).rejects.toMatchObject({
      response: {
        status: 401,
        data: { code: "TOKEN_MISSING" },
      },
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("does not apply platform access token to queued tenant retries", async () => {
    getToken.mockReturnValue("tenant-access-old");
    getRefreshToken.mockReturnValue("tenant-refresh");
    platformGetToken.mockReturnValue("platform-access-old");
    platformGetRefreshToken.mockReturnValue("platform-refresh");

    let resolvePlatformRefresh!: () => void;
    const platformRefreshGate = new Promise<void>((resolve) => {
      resolvePlatformRefresh = resolve;
    });

    const tenantRetryAuthHeaders: string[] = [];

    instance.defaults.adapter = async (config) => {
      const url = config.url ?? "";
      const auth = getAuthorizationHeader(config);

      if (url.includes("/platform/auth/refresh")) {
        await platformRefreshGate;
        return {
          data: {
            data: {
              access_token: "platform-access-new",
              refresh_token: "platform-refresh-new",
            },
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      if (url.includes("/auth/refresh")) {
        return {
          data: {
            data: {
              access_token: "tenant-access-new",
              refresh_token: "tenant-refresh-new",
            },
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      if (url.includes("/platform/tenants")) {
        if (!auth.includes("platform-access-new")) {
          throw axios401(config, {
            error: "expired",
            code: "TOKEN_EXPIRED",
          });
        }
        return {
          data: { data: [] },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      if (url.includes("/billing/subscription")) {
        tenantRetryAuthHeaders.push(auth);
        if (!auth.includes("tenant-access-new")) {
          throw axios401(config, {
            error: "expired",
            code: "TOKEN_EXPIRED",
          });
        }
        return {
          data: { data: {} },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      throw new Error(`Unexpected url in test adapter: ${url}`);
    };

    const platformPromise = instance.get("/platform/tenants", {
      authScope: "platform",
    } as never);

    await Promise.resolve();
    await Promise.resolve();

    const tenantPromise = instance.get("/billing/subscription", {
      authScope: "tenant",
    } as never);

    await Promise.resolve();
    resolvePlatformRefresh();

    await expect(platformPromise).resolves.toMatchObject({ status: 200 });
    await expect(tenantPromise).resolves.toMatchObject({ status: 200 });

    expect(
      tenantRetryAuthHeaders.some((h) => h.includes("platform-access-new")),
    ).toBe(false);
    expect(
      tenantRetryAuthHeaders.some((h) => h.includes("tenant-access-new")),
    ).toBe(true);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("sets withCredentials false on platform-scoped requests", async () => {
    let seenWithCredentials: boolean | undefined;
    instance.defaults.adapter = async (config) => {
      seenWithCredentials = config.withCredentials;
      return {
        data: { data: {} },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    platformGetToken.mockReturnValue("platform-access");
    await instance.get("/platform/tenants");

    expect(seenWithCredentials).toBe(false);
  });

  it("platform 401 without refresh clears platform storage only", async () => {
    getToken.mockReturnValue("tenant-access");
    getRefreshToken.mockReturnValue("tenant-refresh");
    getUser.mockReturnValue({ id: "tenant-1" });
    platformGetToken.mockReturnValue("platform-access");
    platformGetRefreshToken.mockReturnValue(null);

    instance.defaults.adapter = async (config) => {
      throw axios401(config, {
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    };

    await expect(
      instance.get("/platform/tenants", { authScope: "platform" } as never),
    ).rejects.toMatchObject({
      response: { status: 401, data: { code: "TOKEN_EXPIRED" } },
    });

    expect(platformClear).toHaveBeenCalled();
    expect(notifyPlatformUnauthorizedImport).toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
