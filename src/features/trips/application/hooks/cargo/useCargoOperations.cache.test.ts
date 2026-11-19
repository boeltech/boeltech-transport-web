import { describe, expect, it, vi, beforeEach } from "vitest";

import { tripQueryKeys } from "@features/trips/domain";
import { useAddCargo, useUpdateCargo, useDeleteCargo } from "./useCargoOperations";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("@features/trips/infrastructure", () => ({
  cargoRepository: {},
}));

vi.mock("../../useCases/cargo/CargoUseCases", () => ({
  createGetCargosUseCase: vi.fn(),
  createAddCargoUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createUpdateCargoUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createDeleteCargoUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createAddCargoMovementUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createCompleteCargoMovementUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createReassignCargoMovementStopUseCase: vi.fn(() => ({ execute: vi.fn() })),
}));

describe("cargo mutation cache invalidation", () => {
  const tripId = "trip-cargo-1";

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    useMutationMock.mockClear();
  });

  it.each([
    ["useAddCargo", () => useAddCargo(tripId)],
    ["useUpdateCargo", () => useUpdateCargo(tripId)],
    ["useDeleteCargo", () => useDeleteCargo(tripId)],
  ] as const)("%s invalidates cargos, detail and lists", async (_name, factory) => {
    const mutationConfig = factory() as unknown as {
      onSuccess: (
        data: unknown,
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess({}, {}, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.cargos(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
  });
});
