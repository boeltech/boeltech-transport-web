import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriverStatus, driverQueryKeys, type Driver } from "../../domain";

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("../../infrastructure", () => ({
  createDriverRepository: () => ({}),
}));

vi.mock("../index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../index")>();
  return {
    ...actual,
    createUpdateDriverStatusUseCase: () => ({
      execute: vi.fn(),
    }),
  };
});

import { useUpdateDriverStatus } from "./useUpdateDriverStatus";

const driverStub = {
  id: "driver-1",
  status: DriverStatus.RESTING,
} as Driver;

describe("useUpdateDriverStatus", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("invalidates detail/lists/available even when onSuccess option is passed", () => {
    const onSuccess = vi.fn();
    const mutation = useUpdateDriverStatus({ onSuccess }) as unknown as {
      onSuccess?: (
        data: Driver,
        variables: { id: string; data: { status: string } },
        onMutateResult: unknown,
        context: unknown,
      ) => void;
    };

    const variables = {
      id: "driver-1",
      data: { status: DriverStatus.RESTING },
    };

    mutation.onSuccess?.(driverStub, variables, undefined, undefined);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.detail("driver-1"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.available(),
    });
    expect(onSuccess).toHaveBeenCalledWith(
      driverStub,
      variables,
      undefined,
      undefined,
    );
  });
});
