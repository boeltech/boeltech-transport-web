import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockTrackActivationEvent, mockApply, mockPurge } = vi.hoisted(() => ({
  mockTrackActivationEvent: vi.fn(),
  mockApply: vi.fn(),
  mockPurge: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("../../domain/trackActivationEvent", () => ({
  trackActivationEvent: (...args: unknown[]) =>
    mockTrackActivationEvent(...args),
}));

vi.mock("../../infrastructure/demoSeedApi", () => ({
  demoSeedApi: {
    getStatus: vi.fn(),
    apply: (...args: unknown[]) => mockApply(...args),
    purge: (...args: unknown[]) => mockPurge(...args),
  },
}));

import { useApplyDemoSeed, usePurgeDemoSeed } from "./useDemoSeed";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useDemoSeed activation events", () => {
  beforeEach(() => {
    mockTrackActivationEvent.mockReset();
    mockApply.mockReset();
    mockPurge.mockReset();
  });

  it("emits activation_demo_seed_loaded on apply success", async () => {
    mockApply.mockResolvedValue({ runId: "r1", status: "completed" });
    const { result } = renderHook(() => useApplyDemoSeed(), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => {
      expect(mockTrackActivationEvent).toHaveBeenCalledWith(
        "activation_demo_seed_loaded",
      );
    });
  });

  it("emits activation_demo_seed_purged on purge success", async () => {
    mockPurge.mockResolvedValue({ runId: "r1", status: "purged" });
    const { result } = renderHook(() => usePurgeDemoSeed(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(mockTrackActivationEvent).toHaveBeenCalledWith(
        "activation_demo_seed_purged",
      );
    });
  });
});
