import { beforeEach, describe, expect, it, vi } from "vitest";
import { userQueryKeys } from "../../domain";

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);
const refreshProfile = vi.fn().mockResolvedValue(undefined);
const logout = vi.fn().mockResolvedValue(undefined);
const sessionUser = { id: "session-user" };

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: sessionUser,
    refreshProfile,
    logout,
  }),
}));

vi.mock("../../infrastructure", () => ({
  usersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

import { useUpdateUser, useUpdateUserStatus } from "./useUsers";

describe("useUsers session sync (H-U09-Q03)", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
    refreshProfile.mockClear();
    logout.mockClear();
    sessionUser.id = "session-user";
  });

  it("useUpdateUser self → refreshProfile; other user → no", async () => {
    const mutation = useUpdateUser() as unknown as {
      onSuccess?: (
        result: { data: { id: string } },
        variables: { id: string; data: { role: string } },
      ) => Promise<void>;
    };

    await mutation.onSuccess?.(
      { data: { id: "other-user" } },
      { id: "other-user", data: { role: "manager" } },
    );
    expect(refreshProfile).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();

    await mutation.onSuccess?.(
      { data: { id: "session-user" } },
      { id: "session-user", data: { role: "manager" } },
    );
    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: userQueryKeys.lists(),
    });
  });

  it("useUpdateUserStatus self active → refreshProfile; inactive → logout", async () => {
    const mutation = useUpdateUserStatus() as unknown as {
      onSuccess?: (
        result: { data: { id: string } },
        variables: { id: string; data: { status: string } },
      ) => Promise<void>;
    };

    await mutation.onSuccess?.(
      { data: { id: "other-user" } },
      { id: "other-user", data: { status: "inactive" } },
    );
    expect(refreshProfile).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();

    await mutation.onSuccess?.(
      { data: { id: "session-user" } },
      { id: "session-user", data: { status: "active" } },
    );
    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();

    refreshProfile.mockClear();
    await mutation.onSuccess?.(
      { data: { id: "session-user" } },
      { id: "session-user", data: { status: "inactive" } },
    );
    expect(logout).toHaveBeenCalledTimes(1);
    expect(refreshProfile).not.toHaveBeenCalled();
  });
});
