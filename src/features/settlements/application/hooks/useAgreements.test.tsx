import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import {
  useCreateCompensationAgreement,
  useUpdateCompensationAgreement,
} from "./useAgreements";

const SETTLEMENTS_PREVIEW_KEY = ["settlements", "preview"] as const;
const SETTLEMENTS_CUT_PREVIEW_KEY = ["settlements", "cut-preview"] as const;
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"] as const;
const SETTLEMENTS_OPERATORS_KEY = ["settlements", "operators"] as const;

const { mockCreateAgreement, mockUpdateAgreement } = vi.hoisted(() => ({
  mockCreateAgreement: vi.fn(),
  mockUpdateAgreement: vi.fn(),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    createAgreement: mockCreateAgreement,
    updateAgreement: mockUpdateAgreement,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function seedSettlementsCaches(queryClient: QueryClient) {
  queryClient.setQueryData(SETTLEMENTS_PREVIEW_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_CUT_PREVIEW_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_WORKBENCH_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_OPERATORS_KEY, { data: [] });
  queryClient.setQueryData(settlementsQueryKeys.agreements(), { data: [] });
}

describe("useCreate/UpdateCompensationAgreement — Comp→Set invalidación (H-U07-Q01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crear invalida Operadores, preview, cut-preview y workbench", async () => {
    mockCreateAgreement.mockResolvedValue({ id: "agr-1" });
    const { queryClient, wrapper } = createWrapper();
    seedSettlementsCaches(queryClient);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateCompensationAgreement(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        employeeId: "emp-1",
        scheme: "fixed",
        amount: 100,
        effectiveFrom: "2026-09-01",
      } as never);
    });

    expect(queryClient.getQueryState(SETTLEMENTS_OPERATORS_KEY)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(SETTLEMENTS_PREVIEW_KEY)?.isInvalidated).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(SETTLEMENTS_CUT_PREVIEW_KEY)?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_WORKBENCH_KEY)?.isInvalidated).toBe(
      true,
    );
    expect(
      invalidateSpy.mock.calls.some(
        ([filters]) =>
          Array.isArray(filters?.queryKey) &&
          filters.queryKey[0] === "settlements" &&
          filters.queryKey[1] === "operators",
      ),
    ).toBe(true);
    expect(
      invalidateSpy.mock.calls.some(
        ([filters]) =>
          Array.isArray(filters?.queryKey) &&
          filters.queryKey[0] === "settlements" &&
          filters.queryKey[1] === "cut-preview",
      ),
    ).toBe(true);
  });

  it("editar invalida Operadores y cut-preview", async () => {
    mockUpdateAgreement.mockResolvedValue({ id: "agr-1" });
    const { queryClient, wrapper } = createWrapper();
    seedSettlementsCaches(queryClient);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCompensationAgreement(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "agr-1",
        employeeId: "emp-1",
        isActive: false,
      });
    });

    expect(queryClient.getQueryState(SETTLEMENTS_OPERATORS_KEY)?.isInvalidated).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(SETTLEMENTS_CUT_PREVIEW_KEY)?.isInvalidated,
    ).toBe(true);
    expect(
      invalidateSpy.mock.calls.some(
        ([filters]) =>
          Array.isArray(filters?.queryKey) &&
          filters.queryKey[0] === "settlements" &&
          filters.queryKey[1] === "operators",
      ),
    ).toBe(true);
  });
});
