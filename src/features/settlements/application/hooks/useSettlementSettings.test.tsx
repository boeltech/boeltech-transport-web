import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettlementSettings } from "./useSettlementSettings";

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

describe("useSettlementSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expone isError cuando falla la lectura del umbral", async () => {
    mockGetSettings.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useSettlementSettings(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("expone el umbral de VoBo del tenant", async () => {
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: 0,
      activeApproverCount: 1,
      activeExecutorCount: 1,
    });

    const { result } = renderHook(() => useSettlementSettings(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.voboThresholdMxn).toBe(0);
    expect(result.current.data?.activeApproverCount).toBe(1);
    expect(result.current.data?.activeExecutorCount).toBe(1);
    expect(result.current.isError).toBe(false);
  });
});
