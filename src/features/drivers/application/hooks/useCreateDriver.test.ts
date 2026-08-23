import { beforeEach, describe, expect, it, vi } from "vitest";
import { driverQueryKeys, type Driver } from "../../domain";

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
    createCreateDriverUseCase: () => ({
      execute: vi.fn(),
    }),
  };
});

import { useCreateDriver } from "./useCreateDriver";

const driverStub = {
  id: "driver-1",
} as Driver;

describe("useCreateDriver", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("invalidates lists/available even when onSuccess option is passed", () => {
    const onSuccess = vi.fn();
    const mutation = useCreateDriver({ onSuccess }) as unknown as {
      onSuccess?: (
        data: Driver,
        variables: unknown,
        onMutateResult: unknown,
        context: unknown,
      ) => void;
    };

    mutation.onSuccess?.(driverStub, {}, undefined, undefined);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.available(),
    });
    expect(onSuccess).toHaveBeenCalledWith(
      driverStub,
      {},
      undefined,
      undefined,
    );
  });
});
