import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  useAddressSearch,
  isAddressSearchFilterActive,
  isAddressSearchQueryReady,
  normalizeAddressSearchParams,
} from "./useAddressSearch";
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

  it("isAddressSearchFilterActive requires 2+ chars", () => {
    expect(isAddressSearchFilterActive("")).toBe(false);
    expect(isAddressSearchFilterActive("a")).toBe(false);
    expect(isAddressSearchFilterActive("ab")).toBe(true);
    expect(isAddressSearchQueryReady("ab")).toBe(true);
  });

  it("normalizeAddressSearchParams drops short q for browse", () => {
    expect(normalizeAddressSearchParams({ q: "a", limit: 20 }).q).toBeUndefined();
    expect(normalizeAddressSearchParams({ q: "  ", limit: 20 }).q).toBeUndefined();
    expect(normalizeAddressSearchParams({ q: "bodega", limit: 20 }).q).toBe(
      "bodega",
    );
  });

  it("fetches browse list when query is empty and enabled", async () => {
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [],
      pagination: { limit: 50, nextCursor: null, hasMore: false },
    });

    renderHook(
      () =>
        useAddressSearch({
          params: { q: "", limit: 50 },
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(addressSearchApi.searchAddresses).toHaveBeenCalledWith({
        q: undefined,
        limit: 50,
      });
    });
  });

  it("does not fetch when disabled", () => {
    renderHook(
      () =>
        useAddressSearch({
          params: { q: "", limit: 20 },
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(addressSearchApi.searchAddresses).not.toHaveBeenCalled();
  });

  it("fetches with filter when query is 2+ chars", async () => {
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
