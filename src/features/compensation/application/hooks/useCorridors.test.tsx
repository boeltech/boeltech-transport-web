import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateCorridorTariff } from "./useCorridors";

const SETTLEMENTS_PREVIEW_KEY = ["settlements", "preview"] as const;
const SETTLEMENTS_CUT_PREVIEW_KEY = ["settlements", "cut-preview"] as const;
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"] as const;

const { mockUpdateCorridor } = vi.hoisted(() => ({
  mockUpdateCorridor: vi.fn(),
}));

vi.mock("../../infrastructure/compensationApi", () => ({
  compensationApi: {
    updateCorridor: mockUpdateCorridor,
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

describe("useUpdateCorridorTariff — Comp→Set invalidación (H-U07-Q03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("editar corredor invalida preview, cut-preview y workbench", async () => {
    mockUpdateCorridor.mockResolvedValue({ id: "cor-1" });
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(SETTLEMENTS_PREVIEW_KEY, { data: [] });
    queryClient.setQueryData(SETTLEMENTS_CUT_PREVIEW_KEY, { data: [] });
    queryClient.setQueryData(SETTLEMENTS_WORKBENCH_KEY, { data: [] });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCorridorTariff(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "cor-1",
        payload: { fixedAmount: 1500 },
      });
    });

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
          filters.queryKey[1] === "preview",
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
});
