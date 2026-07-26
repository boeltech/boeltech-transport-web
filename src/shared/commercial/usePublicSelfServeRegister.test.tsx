import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@shared/api";
import { usePublicSelfServeRegister } from "./usePublicSelfServeRegister";

vi.mock("@shared/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock("@shared/config/env", () => ({
  default: {
    auth: {
      publicSelfServeRegister: true,
    },
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

describe("usePublicSelfServeRegister", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("abre registro cuando apiClient devuelve body con self_serve_register_open true", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { self_serve_register_open: true },
    });

    const { result } = renderHook(() => usePublicSelfServeRegister(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.resolved).toBe(true);
    });
    expect(result.current.open).toBe(true);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("cierra registro cuando self_serve_register_open es false", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { self_serve_register_open: false },
    });

    const { result } = renderHook(() => usePublicSelfServeRegister(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.resolved).toBe(true);
    });
    expect(result.current.open).toBe(false);
  });

  it("deduplica peticiones entre varios consumidores del mismo QueryClient", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { self_serve_register_open: true },
    });

    const wrapper = createWrapper();
    const a = renderHook(() => usePublicSelfServeRegister(), { wrapper });
    const b = renderHook(() => usePublicSelfServeRegister(), { wrapper });

    await waitFor(() => {
      expect(a.result.current.resolved).toBe(true);
      expect(b.result.current.resolved).toBe(true);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
