import { describe, expect, it, vi, beforeEach } from "vitest";

import { financeQueryKeys } from "@features/finance/domain";
import { tripQueryKeys } from "@features/trips/domain";
import { useVoidOperationalCashReceipt } from "./useVoidOperationalCashReceipt";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    voidOperationalCashReceipt: vi.fn(),
  },
}));

describe("useVoidOperationalCashReceipt cache (Q06)", () => {
  const tripId = "trip-cash-1";

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    useMutationMock.mockClear();
  });

  it("invalida la misma superficie que el alta (trips + finance cash)", async () => {
    const mutationConfig = useVoidOperationalCashReceipt(tripId) as unknown as {
      onSuccess: (
        data: unknown,
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess({}, { receiptId: "r-1", reason: "error" }, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.operationalCashReceipts(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: financeQueryKeys.operationalCashPendingRoot(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: financeQueryKeys.operationalReceiptBatchesRoot(),
    });
  });
});
