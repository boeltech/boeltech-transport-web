/**
 * Smoke ADR-0099 AX-1 — el badge global del sidebar cuenta «Me toca», no
 * «Todas». Usa el `approvalsApi` real con el cliente HTTP simulado: 3 pendientes
 * asignadas al usuario frente a 9 en la cola completa.
 */
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { approvalsApi } from "@features/approvals/infrastructure/approvalsApi";
import { useNavigationWithBadges } from "@widgets/sidebar/model/useNavigationWithBadges";

const { mockApiGet } = vi.hoisted(() => ({ mockApiGet: vi.fn() }));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: (...args: unknown[]) => mockApiGet(...args),
    },
  };
});

vi.mock("@shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "manager",
  }),
}));

const MINE_PER_TYPE = 1;
const ALL_PER_TYPE = 3;

function countResponse(total: number) {
  return {
    data: [],
    pagination: { page: 1, page_size: 1, total, total_pages: total > 0 ? total : 0 },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dashboard"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("smoke approvals ADR-0099 AX-1 badge «Me toca»", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation(
      async (_url: string, config?: { params?: Record<string, string> }) => {
        const params = config?.params ?? {};
        if (params.assigned_to_me === "true") return countResponse(MINE_PER_TYPE);
        if (params.include_returned === "true") return countResponse(ALL_PER_TYPE);
        return countResponse(0);
      },
    );
  });

  it("3 «Me toca» / 9 «Todas»: el sidebar muestra 3 y solo consulta la cola asignada", async () => {
    const { result } = renderHook(() => useNavigationWithBadges(), { wrapper });

    await waitFor(() => {
      const approvalsItem = result.current.navigation
        .flatMap((group) => group.items)
        .find((item) => item.id === "finance-approvals");
      expect(approvalsItem?.badge).toBe(3);
    });

    expect(mockApiGet).toHaveBeenCalledTimes(3);
    for (const [url, config] of mockApiGet.mock.calls) {
      expect(url).toBe("/finance/approvals");
      expect(config.params).toMatchObject({ status: "pending", assigned_to_me: "true" });
      expect(config.params).not.toHaveProperty("include_returned");
    }
    expect(
      new Set(mockApiGet.mock.calls.map(([, config]) => config.params.type)),
    ).toEqual(new Set(["trip_expense", "driver_advance_request", "internal_staff_compensation"]));

    // Contraste: la cola «Todas» del mismo tenant suma 9.
    await expect(approvalsApi.getPendingCount(undefined, "all")).resolves.toBe(9);
  });
});
