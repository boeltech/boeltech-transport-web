import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGpsTrackingEntitlement } from "./useGpsTrackingEntitlement";

const mockUseEntitlement = vi.fn();

vi.mock("@features/billing", () => ({
  useEntitlement: (...args: unknown[]) => mockUseEntitlement(...args),
}));

describe("useGpsTrackingEntitlement", () => {
  it("gates when not_contracted", () => {
    mockUseEntitlement.mockReturnValue({
      state: "not_contracted",
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(mockUseEntitlement).toHaveBeenCalledWith("gps_tracking");
    expect(result.current.showNotActivated).toBe(true);
    expect(result.current.canUseModule).toBe(false);
    expect(result.current.hasModule).toBe(false);
  });

  it("holds GPS queries while loading", () => {
    mockUseEntitlement.mockReturnValue({
      state: "loading",
      isSuccess: false,
      isLoading: true,
      isFetching: true,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(false);
  });

  it("does not treat unknown (access error) as not entitled", () => {
    mockUseEntitlement.mockReturnValue({
      state: "unknown",
      isSuccess: false,
      isLoading: false,
      isFetching: false,
      isError: true,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(true);
  });

  it("allows module when active", () => {
    mockUseEntitlement.mockReturnValue({
      state: "active",
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(true);
    expect(result.current.hasModule).toBe(true);
  });

  it("blocks queries when unavailable", () => {
    mockUseEntitlement.mockReturnValue({
      state: "unavailable",
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(() => useGpsTrackingEntitlement());
    expect(result.current.showNotActivated).toBe(false);
    expect(result.current.canUseModule).toBe(false);
  });
});
