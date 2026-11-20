import { describe, expect, it, vi, beforeEach } from "vitest";

import { tripQueryKeys } from "@features/trips/domain";
import { useVoidOperationalCashReceiptFromCollection } from "./useCollectionDetail";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("@features/finance/infrastructure/collectionDetailApi", () => ({
  collectionDetailApi: {
    voidReceipt: vi.fn(),
  },
}));

vi.mock("./useOperationalReceiptBatch", () => ({
  invalidateOperationalReceiptBatchSurface: vi.fn(),
}));

describe("useVoidOperationalCashReceiptFromCollection cache (Q07)", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    useMutationMock.mockClear();
  });

  it("invalida tripQueryKeys.all (fábrica, no literal)", () => {
    const mutationConfig = useVoidOperationalCashReceiptFromCollection() as unknown as {
      onSuccess: (
        data: unknown,
        variables: { tripId: string; receiptId: string; reason: string },
        context: unknown,
        mutation: unknown,
      ) => void;
    };

    mutationConfig.onSuccess(
      {},
      { tripId: "trip-1", receiptId: "r-1", reason: "dup" },
      {},
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.all,
    });
    expect(tripQueryKeys.all).toEqual(["trips"]);
  });
});
