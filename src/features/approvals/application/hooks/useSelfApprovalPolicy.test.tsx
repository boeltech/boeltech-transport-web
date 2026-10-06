import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createTestWrapper } from "@/test/renderWithProviders";
import { setMockAuthUser } from "@/test/mocks/auth";
import { grantPermissions } from "@/test/mocks/permissions";
import { approvalsApi } from "../../infrastructure";
import type { SelfApprovalPolicy } from "../../domain";
import { approvalsQueryKeys } from "../approvalsQueryKeys";
import {
  SELF_APPROVAL_POLICY_STALE_TIME_MS,
  useSelfActionForbiddenHandler,
  useSelfActionResolver,
  useSelfApprovalPolicy,
} from "./useSelfApprovalPolicy";

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock(),
);

const policy: SelfApprovalPolicy = {
  advanceApprove: { allowed: true, activeCounterpartCount: 0 },
  advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
  settlementApprove: { allowed: false, activeCounterpartCount: 2 },
  settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
  tripExpenseApprove: { allowed: true, activeCounterpartCount: 0 },
};

function createWrapper() {
  return createTestWrapper({ withRouter: false });
}

describe("useSelfApprovalPolicy (ADR-0098)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    grantPermissions("all");
    setMockAuthUser({ id: "user-1" });
  });

  it("consulta la política con finance_approvals.read y staleTime ≤ 60 s", async () => {
    const spy = vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);
    const permissions = grantPermissions("all");

    const { result } = renderHook(() => useSelfApprovalPolicy(), {
      wrapper: createWrapper().Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(policy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(permissions.hasPermission).toHaveBeenCalledWith("finance_approvals", "read");
    expect(SELF_APPROVAL_POLICY_STALE_TIME_MS).toBeLessThanOrEqual(60_000);
  });

  it("no consulta sin permiso de lectura de aprobaciones", () => {
    grantPermissions("none");
    const spy = vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);

    const { result } = renderHook(() => useSelfApprovalPolicy(), {
      wrapper: createWrapper().Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(spy).not.toHaveBeenCalled();
  });

  it("useSelfActionResolver combina usuario en sesión y concepto", async () => {
    vi.spyOn(approvalsApi, "getSelfApprovalPolicy").mockResolvedValue(policy);
    const wrapper = createWrapper().Wrapper;

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
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSelfActionForbiddenHandler(), {
      wrapper: Wrapper,
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
