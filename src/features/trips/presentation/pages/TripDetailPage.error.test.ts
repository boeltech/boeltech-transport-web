import { describe, expect, it } from "vitest";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { tripDetailCopy } from "../copy";
import { resolveTripAccessDeniedCopy } from "../utils/tripWayfinding";

const shell = tripDetailCopy.shell;

describe("TripDetailPage error handling helpers", () => {
  it("sanitizes back navigation href", () => {
    expect(resolveInternalAppHref("/approvals", "/trips")).toBe("/approvals");
    expect(resolveInternalAppHref("https://evil.example", "/trips")).toBe("/trips");
  });

  it("classifies trip query errors for dedicated UI states", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: { isAxiosError: true, response: { status: 403 } },
        hasData: false,
      }),
    ).toBe("forbidden");

    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: { isAxiosError: true, response: { status: 404 } },
        hasData: false,
      }),
    ).toBe("notFound");

    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: { isAxiosError: true, response: { status: 500 } },
        hasData: false,
      }),
    ).toBe("serverError");
  });

  it("exposes copy for access denied and load error states", () => {
    expect(shell.state.accessDeniedTitle).toContain("acceso");
    expect(shell.state.loadErrorTitle).toBeTruthy();
    expect(shell.state.retryLoad).toBeTruthy();
  });

  it("403 driver escala a administración y back a Mis viajes (D9)", () => {
    const staff = resolveTripAccessDeniedCopy(false);
    expect(staff.description).toBe(shell.state.accessDeniedDescription);
    expect(staff.backLabel).toBe(shell.state.backToList);

    const driver = resolveTripAccessDeniedCopy(true);
    expect(driver.description).toBe(shell.state.accessDeniedDescriptionDriver);
    expect(driver.description).toMatch(/administración/i);
    expect(driver.backLabel).toBe(shell.state.backToListDriver);
  });
});
