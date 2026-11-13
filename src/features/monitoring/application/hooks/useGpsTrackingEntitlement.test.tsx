import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGpsTrackingEntitlement } from "./useGpsTrackingEntitlement";

const mockUseHasBillingModule = vi.fn();

vi.mock("@features/billing", () => ({
  useHasBillingModule: (...args: unknown[]) =>
    mockUseHasBillingModule(...args),
}));

describe("useGpsTrackingEntitlement", () => {
  it("gates when access succeeded without gps_tracking", () => {
    mockUseHasBillingModule.mockReturnValue({
      hasModule: false,
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(mockUseHasBillingModule).toHaveBeenCalledWith("gps_tracking");
    expect(result.current.showNotActivated).toBe(true);
    expect(result.current.canUseModule).toBe(false);
  });

  it("holds GPS queries while access is still loading", () => {
    mockUseHasBillingModule.mockReturnValue({
      hasModule: false,
      isSuccess: false,
      isLoading: true,
      isFetching: true,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(false);
  });

  it("does not treat access error as not entitled", () => {
    mockUseHasBillingModule.mockReturnValue({
      hasModule: false,
      isSuccess: false,
      isLoading: false,
      isFetching: false,
      isError: true,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(true);
  });

  it("allows module when entitled", () => {
    mockUseHasBillingModule.mockReturnValue({
      hasModule: true,
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(true);
  });
});
