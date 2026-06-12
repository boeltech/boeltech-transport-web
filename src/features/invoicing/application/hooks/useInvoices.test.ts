import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCreateInvoice, invoiceQueryKeys } from "./useInvoices";

const invalidateQueries = vi.fn();
const onSuccessSpy = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("@features/invoicing/infrastructure", () => ({
  invoicingApi: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getPayments: vi.fn(),
    getPrefillFromTrip: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    stamp: vi.fn(),
    cancel: vi.fn(),
    registerPayment: vi.fn(),
    substituteStampedInvoice: vi.fn(),
    openPdf: vi.fn(),
    downloadXml: vi.fn(),
  },
}));

describe("useCreateInvoice cache invalidation", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    onSuccessSpy.mockReset();
    useMutationMock.mockClear();
  });

  it("invalidates lists, finance root and trips without prefill", () => {
    const mutationConfig = useCreateInvoice({
      onSuccess: onSuccessSpy,
    }) as unknown as {
      onSuccess: (
        data: { id: string },
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => void;
    };

    mutationConfig.onSuccess({ id: "inv-1" }, {}, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: invoiceQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["finance"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["trips"],
    });

    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["invoices", "prefill"],
    });
    expect(onSuccessSpy).toHaveBeenCalled();
  });
});
