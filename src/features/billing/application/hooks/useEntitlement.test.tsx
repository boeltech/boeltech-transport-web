import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { deriveEntitlementState, useEntitlement } from "./useEntitlement";

const mockUseBillingAccess = vi.fn();

vi.mock("./useBilling", () => ({
  useBillingAccess: (...args: unknown[]) => mockUseBillingAccess(...args),
}));

describe("deriveEntitlementState", () => {
  it("returns unavailable over active when code is in both lists", () => {
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        isError: false,
        data: {
          effectiveModuleCodes: ["gps_tracking"],
          unavailableModuleCodes: ["gps_tracking"],
        },
      }),
    ).toBe("unavailable");
  });

  it("returns active when entitled and available", () => {
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        isError: false,
        data: {
          effectiveModuleCodes: ["gps_tracking"],
          unavailableModuleCodes: [],
        },
      }),
    ).toBe("active");
  });

  it("returns not_contracted on success without the code", () => {
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        isError: false,
        data: {
          effectiveModuleCodes: ["internal_staff_compensation"],
          unavailableModuleCodes: [],
        },
      }),
    ).toBe("not_contracted");
  });

  it("returns loading while fetching without success", () => {
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: false,
        isLoading: true,
        isFetching: true,
        isError: false,
      }),
    ).toBe("loading");
  });

  it("returns unknown on error or idle (exento / query off)", () => {
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: false,
        isLoading: false,
        isFetching: false,
        isError: true,
      }),
    ).toBe("unknown");
    expect(
      deriveEntitlementState("gps_tracking", {
        isSuccess: false,
        isLoading: false,
        isFetching: false,
        isError: false,
      }),
    ).toBe("unknown");
  });
});

describe("useEntitlement", () => {
  it("maps billing access into entitlement state", () => {
    mockUseBillingAccess.mockReturnValue({
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        effectiveModuleCodes: [],
        unavailableModuleCodes: [],
      },
    });

    const { result } = renderHook(() => useEntitlement("gps_tracking"));
    expect(result.current.state).toBe("not_contracted");
  });
});
