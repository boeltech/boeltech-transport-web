import { describe, expect, it, vi, beforeEach } from "vitest";

import { clientQueryKeys } from "@features/clients/domain";
import { financeQueryKeys } from "./useFinance";
import { useRegisterFinancePayment } from "./useFinancePayments";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const queryDataStore = new Map<string, unknown>();
const useMutationMock = vi.fn((config: unknown) => config);
const onSuccessSpy = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    getQueriesData: ({ queryKey }: { queryKey: readonly unknown[] }) => {
      const matched: Array<[readonly unknown[], unknown]> = [];
      for (const [storedKey, data] of queryDataStore.entries()) {
        const parsed = JSON.parse(storedKey) as unknown[];
        if (
          Array.isArray(parsed) &&
          queryKey.every((part, i) => parsed[i] === part)
        ) {
          matched.push([parsed, data]);
        }
      }
      return matched;
    },
  }),
}));

vi.mock("@features/finance/infrastructure/financePaymentsApi", () => ({
  financePaymentsApi: {
    registerPayment: vi.fn(),
    retryRepStamp: vi.fn(),
    getOpenPpdInvoices: vi.fn(),
    getOpenPpdSummary: vi.fn(),
    getRepExceptions: vi.fn(),
    getRepStatusByIds: vi.fn(),
  },
  OPEN_PPD_INVOICES_PAGE_SIZE: 25,
}));

describe("useRegisterFinancePayment cache (C5)", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    onSuccessSpy.mockReset();
    useMutationMock.mockClear();
    queryDataStore.clear();
  });

  it("invalidates client detail (Por cobrar + crédito) from open-ppd cache", () => {
    const clientId = "client-fin-1";
    const invoiceId = "inv-fin-1";
    queryDataStore.set(
      JSON.stringify(
        financeQueryKeys.openPpdInvoices({
          clientId,
          receiverRfc: null,
          search: null,
          cobrosBucket: null,
          page: 1,
          limit: 25,
        }),
      ),
      { data: [{ id: invoiceId }] },
    );

    const mutationConfig = useRegisterFinancePayment({
      onSuccess: onSuccessSpy,
    }) as unknown as {
      onSuccess: (
        data: unknown,
        variables: {
          receiverRfc: string;
          amount: number;
          paymentDate: string;
          paymentForm: string;
          allocations: Array<{ ingressInvoiceId: string; amount: number }>;
        },
        context: unknown,
        mutation: unknown,
      ) => void;
    };

    mutationConfig.onSuccess(
      {},
      {
        receiverRfc: "XAXX010101000",
        amount: 100,
        paymentDate: "2026-11-20",
        paymentForm: "03",
        allocations: [{ ingressInvoiceId: invoiceId, amount: 100 }],
      },
      {},
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.detail(clientId),
    });
    expect(onSuccessSpy).toHaveBeenCalled();
  });
});
