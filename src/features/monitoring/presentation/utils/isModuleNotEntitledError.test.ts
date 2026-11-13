import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { isModuleNotEntitledError } from "./isModuleNotEntitledError";

describe("isModuleNotEntitledError", () => {
  it("returns true for MODULE_NOT_ENTITLED", () => {
    expect(
      isModuleNotEntitledError(
        new ApiError("denied", 403, "MODULE_NOT_ENTITLED"),
      ),
    ).toBe(true);
  });

  it("returns false for other API codes", () => {
    expect(
      isModuleNotEntitledError(
        new ApiError("off", 403, "GPS_TRACKING_DISABLED"),
      ),
    ).toBe(false);
  });

  it("returns false for non-API errors", () => {
    expect(isModuleNotEntitledError(new Error("boom"))).toBe(false);
  });
});
