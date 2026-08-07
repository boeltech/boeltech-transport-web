import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IAuthRepository, ITokenStorage } from "../../domain";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";
import { LogoutUseCase } from "./LogoutUseCase";

vi.mock("../../infrastructure/sessionMode", () => ({
  usesAuthCookies: () => false,
}));

describe("LogoutUseCase session isolation", () => {
  let authRepository: IAuthRepository;
  let tokenStorage: ITokenStorage;
  let logoutUseCase: LogoutUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    platformTokenStorage.setToken("platform-at");
    platformTokenStorage.setRefreshToken("platform-rt");
    platformTokenStorage.setUser({
      id: "platform-user-1",
      email: "owner@boeltech.test",
      firstName: "Platform",
      lastName: "Owner",
      platformRole: "platform_owner",
      scope: "platform",
      mfaEnabled: false,
    });

    authRepository = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as IAuthRepository;
    tokenStorage = {
      getRefreshToken: vi.fn().mockReturnValue("tenant-refresh"),
      clear: vi.fn(),
    } as unknown as ITokenStorage;
    logoutUseCase = new LogoutUseCase(authRepository, tokenStorage);
  });

  it("clears tenant storage only and leaves platform session intact", async () => {
    await logoutUseCase.execute();

    expect(authRepository.logout).toHaveBeenCalledWith("tenant-refresh");
    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);
    expect(platformTokenStorage.getToken()).toBe("platform-at");
    expect(platformTokenStorage.getRefreshToken()).toBe("platform-rt");
    expect(platformTokenStorage.hasSession()).toBe(true);
  });

  it("still clears tenant storage when backend logout fails", async () => {
    vi.mocked(authRepository.logout).mockRejectedValue(new Error("network"));

    await logoutUseCase.execute();

    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);
    expect(platformTokenStorage.hasSession()).toBe(true);
  });
});
