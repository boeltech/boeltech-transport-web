import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUpdateClientAddress } from "./useUpdateClientAddress";
import { clientQueryKeys, type ClientAddress } from "../../domain";

const {
  invalidateQueries,
  removeQueries,
  setQueryData,
  useMutationMock,
  invoicePrefillKey,
} = vi.hoisted(() => {
  const invoicePrefillKey = ["invoices", "prefill"] as const;
  return {
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    setQueryData: vi.fn(),
    useMutationMock: vi.fn((config: unknown) => config),
    invoicePrefillKey,
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    removeQueries,
    setQueryData,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Avoid @features/invoicing barrel → useInvoiceReceiverClientType → @features/clients
// which pulls CreateClientUseCase against this incomplete infrastructure mock.
vi.mock("@features/invoicing/application", () => ({
  invoiceQueryKeys: {
    prefills: () => invoicePrefillKey,
  },
  evictInvoicePrefillQueries: (queryClient: {
    removeQueries: (arg: { queryKey: unknown }) => void;
  }) => {
    queryClient.removeQueries({ queryKey: invoicePrefillKey });
  },
}));

vi.mock("../../infrastructure", () => ({
  clientAddressRepository: {
    update: vi.fn(),
  },
}));

const address: ClientAddress = {
  id: "addr-1",
  tenantId: "tenant-1",
  clientId: "client-1",
  addressType: "billing",
  isPrimary: true,
  isActive: true,
  postalCode: "01210",
};

describe("useUpdateClientAddress cache invalidation", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    removeQueries.mockReset();
    setQueryData.mockReset();
    useMutationMock.mockClear();
  });

  it("evicts invoice prefill so /invoices/new does not keep a stale fiscal CP", () => {
    const mutationConfig = useUpdateClientAddress({ silent: true }) as unknown as {
      onSuccess: (
        data: ClientAddress,
        variables: { clientId: string; addressId: string },
      ) => void;
    };

    mutationConfig.onSuccess(address, {
      clientId: "client-1",
      addressId: "addr-1",
    });

    expect(setQueryData).toHaveBeenCalledWith(
      clientQueryKeys.address("client-1", "addr-1"),
      address,
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.addresses("client-1"),
    });
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: invoicePrefillKey,
    });
  });
});
