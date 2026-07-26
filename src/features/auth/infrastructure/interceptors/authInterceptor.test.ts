import axios, { type AxiosError, type AxiosInstance } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getRefreshToken, getToken, getUser, clear } = vi.hoisted(() => ({
  getRefreshToken: vi.fn(),
  getToken: vi.fn(),
  getUser: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("../storage/tokenStorage", () => ({
  tokenStorage: {
    getToken,
    getRefreshToken,
    getUser,
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
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
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("@features/platform/infrastructure/platformSessionHandlers", () => ({
  notifyPlatformUnauthorized: vi.fn(),
}));

import { setupAuthInterceptor } from "./authInterceptor";

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
      const error = new Error("Request failed with status code 401") as AxiosError;
      error.isAxiosError = true;
      error.config = config;
      error.response = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        data: {
          error: "Credenciales inválidas",
          code: "INVALID_CREDENTIALS",
        },
      };
      throw error;
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
      const error = new Error("Request failed with status code 401") as AxiosError;
      error.isAxiosError = true;
      error.config = config;
      error.response = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        data: {
          error: "Token de autenticación no proporcionado",
          code: "TOKEN_MISSING",
        },
      };
      throw error;
    };

    await expect(instance.get("/billing/subscription")).rejects.toMatchObject({
      response: {
        status: 401,
        data: { code: "TOKEN_MISSING" },
      },
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
