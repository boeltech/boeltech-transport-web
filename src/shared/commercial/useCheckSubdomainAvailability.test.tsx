import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@shared/api";
import { useCheckSubdomainAvailability } from "./useCheckSubdomainAvailability";

vi.mock("@shared/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useCheckSubdomainAvailability", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no consulta si el subdomain tiene menos de 3 caracteres", async () => {
    const { result } = renderHook(() => useCheckSubdomainAvailability("ab"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.available).toBeNull();
  });

  it("consulta una vez tras debounce y reporta disponibilidad", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        available: true,
        subdomain: "acme",
        suggestion: undefined,
      },
    });

    const { result } = renderHook(
      () => useCheckSubdomainAvailability("acme"),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(result.current.available).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/onboarding/check-subdomain?subdomain=acme",
    );
  });
});
