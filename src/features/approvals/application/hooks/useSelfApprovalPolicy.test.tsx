import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { approvalsApi } from "../../infrastructure";
import type { SelfApprovalPolicy } from "../../domain";
import { approvalsQueryKeys } from "../approvalsQueryKeys";
import {
  SELF_APPROVAL_POLICY_STALE_TIME_MS,
  useSelfActionForbiddenHandler,
  useSelfActionResolver,
  useSelfApprovalPolicy,
} from "./useSelfApprovalPolicy";

const mockHasPermission = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const policy: SelfApprovalPolicy = {
  advanceApprove: { allowed: true, activeCounterpartCount: 0 },
  advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
  settlementApprove: { allowed: false, activeCounterpartCount: 2 },
  settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
  tripExpenseApprove: { allowed: true, activeCounterpartCount: 0 },
};

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("useSelfApprovalPolicy (ADR-0098)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockHasPermission.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  it("consulta la política con finance_approvals.read y staleTime ≤ 60 s", async () => {
    const spy = vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useSelfApprovalPolicy(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(policy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockHasPermission).toHaveBeenCalledWith("finance_approvals", "read");
    expect(SELF_APPROVAL_POLICY_STALE_TIME_MS).toBeLessThanOrEqual(60_000);
  });

  it("no consulta sin permiso de lectura de aprobaciones", () => {
    mockHasPermission.mockReturnValue(false);
    const spy = vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);

    const { result } = renderHook(() => useSelfApprovalPolicy(), {
      wrapper: createWrapper(createQueryClient()),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(spy).not.toHaveBeenCalled();
  });

  it("useSelfActionResolver combina usuario en sesión y concepto", async () => {
    vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const { result: expense } = renderHook(
      () => useSelfActionResolver("tripExpenseApprove"),
      { wrapper },
    );
    const { result: settlement } = renderHook(
      () => useSelfActionResolver("settlementApprove"),
      { wrapper },
    );

    // Antes de cargar la política, lo propio queda bloqueado (fail-closed).
    expect(expense.current(["user-1"])).toBe("blocked_own");

    await waitFor(() => expect(expense.current(["user-1"])).toBe("self_confirm"));
    expect(expense.current(["user-2"])).toBe("normal");
    expect(settlement.current([null, "user-1"])).toBe("blocked_own");
  });

  it("un 403 de autoacción invalida la política; otros errores no", async () => {
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSelfActionForbiddenHandler(), {
      wrapper: createWrapper(queryClient),
    });

    let recognized: ReturnType<typeof result.current> = null;
    act(() => {
      recognized = result.current({
        code: "SETTLEMENT_MAKER_UNKNOWN",
        message: "No se pudo determinar quién armó el corte.",
        details: { reason: "strict_maker_unknown" },
      });
    });
    expect(recognized).toEqual({
      code: "SETTLEMENT_MAKER_UNKNOWN",
      message: "No se pudo determinar quién armó el corte.",
      reason: "strict_maker_unknown",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: approvalsQueryKeys.selfApprovalPolicy(),
    });

    invalidateSpy.mockClear();
    act(() => {
      recognized = result.current(new Error("boom"));
    });
    expect(recognized).toBeNull();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
