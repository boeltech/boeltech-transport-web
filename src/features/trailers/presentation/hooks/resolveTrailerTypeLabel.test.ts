import { describe, expect, it } from "vitest";
import { resolveTrailerTypeLabel } from "./resolveTrailerTypeLabel";

describe("resolveTrailerTypeLabel", () => {
  const options = [
    { code: "CTR001", name: "Caja seca" },
    { code: "CTR002", name: "  Plataforma  " },
  ];

  it("returns the catalog name for a matching code", () => {
    expect(resolveTrailerTypeLabel(options, "CTR001")).toBe("Caja seca");
  });

  it("trims the catalog name", () => {
    expect(resolveTrailerTypeLabel(options, "CTR002")).toBe("Plataforma");
  });

  it("never falls back to the raw code", () => {
    expect(resolveTrailerTypeLabel(options, "UNKNOWN")).toBeNull();
    expect(resolveTrailerTypeLabel(undefined, "CTR001")).toBeNull();
    expect(resolveTrailerTypeLabel(options, null)).toBeNull();
    expect(resolveTrailerTypeLabel(options, "  ")).toBeNull();
  });
});
