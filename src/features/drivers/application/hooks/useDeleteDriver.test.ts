import { beforeEach, describe, expect, it, vi } from "vitest";
import { driverQueryKeys } from "../../domain";

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
    createDeleteDriverUseCase: () => ({
      execute: vi.fn(),
    }),
  };
});

import { useDeleteDriver } from "./useDeleteDriver";

describe("useDeleteDriver", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("invalidates detail/lists/available even when onSuccess option is passed", () => {
    const onSuccess = vi.fn();
    const mutation = useDeleteDriver({ onSuccess }) as unknown as {
      onSuccess?: (
        data: { message: string },
        variables: string,
        onMutateResult: unknown,
        context: unknown,
      ) => void;
    };

    mutation.onSuccess?.(
      { message: "ok" },
      "driver-1",
      undefined,
      undefined,
    );

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
      { message: "ok" },
      "driver-1",
      undefined,
      undefined,
    );
  });
});
