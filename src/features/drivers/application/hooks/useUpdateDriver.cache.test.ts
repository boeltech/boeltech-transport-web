import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardQueryKeys } from "@features/dashboard/domain";
import { fleetDocumentsQueryKeys } from "@features/fleet-documents/domain";
import { driverQueryKeys, type Driver } from "../../domain";

const invalidateQueries = vi.fn();
const setQueryData = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries, setQueryData }),
}));

vi.mock("@features/notifications/application/invalidateNotificationsQueries", () => ({
  invalidateNotificationsQueries: vi.fn(),
}));

vi.mock("../../infrastructure", () => ({
  createDriverRepository: () => ({}),
}));

vi.mock("../index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../index")>();
  return {
    ...actual,
    createUpdateDriverUseCase: () => ({
      execute: vi.fn(),
    }),
  };
});

import { useUpdateDriver } from "./useUpdateDriver";

describe("useUpdateDriver cache (ola5 C1)", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
    setQueryData.mockClear();
  });

  it("invalidates fleet documents and dashboard after update", () => {
    const driver = { id: "driver-1" } as Driver;
    const mutation = useUpdateDriver() as unknown as {
      onSuccess: (
        data: Driver,
        variables: { id: string; data: Record<string, unknown> },
      ) => void;
    };

    mutation.onSuccess(driver, { id: "driver-1", data: {} });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.detail("driver-1"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
  });
});
