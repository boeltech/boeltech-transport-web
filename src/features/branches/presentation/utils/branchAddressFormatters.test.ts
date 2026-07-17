import { describe, expect, it } from "vitest";
import { formatBranchFullAddress, formatBranchListLocation } from "./branchAddressFormatters";

describe("formatBranchFullAddress", () => {
  it("formats a complete address in readable lines", () => {
    const lines = formatBranchFullAddress({
      street: "Av. Constitución",
      exteriorNumber: "1234",
      interiorNumber: "2",
      neighborhood: "Centro",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      country: "México",
    } as never);

    expect(lines).toEqual([
      "Av. Constitución No. 1234 Int. 2",
      "Centro, C.P. 64000",
      "Monterrey, Nuevo León, México",
    ]);
  });

  it("omits empty parts", () => {
    const lines = formatBranchFullAddress({
      street: "Calle Principal",
      exteriorNumber: null,
      interiorNumber: null,
      neighborhood: null,
      city: "Guadalajara",
      state: "Jalisco",
      postalCode: "44100",
      country: "México",
    } as never);

    expect(lines).toEqual([
      "Calle Principal",
      "C.P. 44100",
      "Guadalajara, Jalisco, México",
    ]);
  });
});

describe("formatBranchListLocation", () => {
  it("joins city and state", () => {
    expect(formatBranchListLocation("El Marqués", "Querétaro")).toBe(
      "El Marqués, Querétaro",
    );
  });

  it("returns empty string when both are missing", () => {
    expect(formatBranchListLocation("", null)).toBe("");
  });
});
