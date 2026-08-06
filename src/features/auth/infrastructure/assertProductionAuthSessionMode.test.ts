import { describe, expect, it } from "vitest";
import { assertProductionAuthSessionMode } from "./assertProductionAuthSessionMode";

describe("assertProductionAuthSessionMode", () => {
  it("allows cookies in production", () => {
    expect(() =>
      assertProductionAuthSessionMode("cookies", true),
    ).not.toThrow();
  });

  it("allows dual outside production", () => {
    expect(() => assertProductionAuthSessionMode("dual", false)).not.toThrow();
  });

  it("rejects dual in production", () => {
    expect(() => assertProductionAuthSessionMode("dual", true)).toThrow(
      /VITE_AUTH_SESSION_MODE/,
    );
  });

  it("rejects bearer in production", () => {
    expect(() => assertProductionAuthSessionMode("bearer", true)).toThrow(
      /cookies/,
    );
  });
});
