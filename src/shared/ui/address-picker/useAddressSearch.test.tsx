import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useAddressSearch, isAddressSearchQueryReady } from "./useAddressSearch";
import * as addressSearchApi from "./addressSearchApi";

vi.mock("./addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useAddressSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isAddressSearchQueryReady requires 2+ chars", () => {
    expect(isAddressSearchQueryReady("a")).toBe(false);
    expect(isAddressSearchQueryReady("ab")).toBe(true);
  });

  it("does not fetch when query is too short", () => {
    renderHook(
      () =>
        useAddressSearch({
          params: { q: "a", limit: 20 },
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(addressSearchApi.searchAddresses).not.toHaveBeenCalled();
  });

  it("fetches when query is ready and enabled", async () => {
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });

    renderHook(
      () =>
        useAddressSearch({
          params: { q: "bodega", limit: 20 },
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(addressSearchApi.searchAddresses).toHaveBeenCalledWith({
        q: "bodega",
        limit: 20,
      });
    });
  });
});
