import { describe, expect, it, vi, beforeEach } from "vitest";

import { tripQueryKeys } from "@features/trips/domain";
import { financeQueryKeys } from "@features/finance/domain";
import {
  useRetryPaymentRep,
  useVoidOperationalCashReceiptFromCollection,
} from "./useCollectionDetail";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const queryDataStore = new Map<string, unknown>();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    getQueryData: (queryKey: readonly unknown[]) =>
      queryDataStore.get(JSON.stringify(queryKey)),
  }),
}));

vi.mock("@features/finance/infrastructure/collectionDetailApi", () => ({
  collectionDetailApi: {
    voidReceipt: vi.fn(),
    retryRep: vi.fn(),
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

describe("useRetryPaymentRep cache (C7)", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    useMutationMock.mockClear();
    queryDataStore.clear();
  });

  it("invalidates linked invoice detail from cached collection allocations", () => {
    const paymentId = "pay-1";
    const invoiceId = "inv-linked-1";
    queryDataStore.set(
      JSON.stringify(financeQueryKeys.paymentCollectionDetail(paymentId)),
      {
        allocations: [{ ingressInvoiceId: invoiceId, amount: 100 }],
      },
    );

    const mutationConfig = useRetryPaymentRep() as unknown as {
      onSuccess: (
        data: unknown,
        variables: { paymentId: string },
        context: unknown,
        mutation: unknown,
      ) => void;
    };

    mutationConfig.onSuccess({}, { paymentId }, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "detail", invoiceId],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "list"],
    });
  });
});

