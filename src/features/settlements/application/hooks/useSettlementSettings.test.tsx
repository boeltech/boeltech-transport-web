import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePagosOperadoresGreenfield } from "./useSettlementSettings";

const mockGetSettings = vi.fn();

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    getSettings: () => mockGetSettings(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePagosOperadoresGreenfield (H8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("un fallo de lectura expone isError y NO se disfraza de flag apagado", async () => {
    mockGetSettings.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => usePagosOperadoresGreenfield(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // isReady es lo que bloquea los CTA de dinero: sin configuración no se opera.
    expect(result.current.isReady).toBe(false);
    expect(result.current.settings).toBeUndefined();
    expect(result.current.enabled).toBe(false);
  });

  it("con el flag apagado queda listo para operar en as-is", async () => {
    mockGetSettings.mockResolvedValue({
      pagosOperadoresGreenfieldV1: false,
      voboThresholdMxn: 5000,
    });

    const { result } = renderHook(() => usePagosOperadoresGreenfield(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.enabled).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("con el flag encendido expone el umbral vigente", async () => {
    mockGetSettings.mockResolvedValue({
      pagosOperadoresGreenfieldV1: true,
      voboThresholdMxn: 12000,
    });

    const { result } = renderHook(() => usePagosOperadoresGreenfield(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.enabled).toBe(true);
    expect(result.current.thresholdMxn).toBe(12000);
  });
});
