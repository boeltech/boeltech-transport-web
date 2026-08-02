import { describe, expect, it } from "vitest";
import { resolveCatalogOptionLabel } from "./useVehicleCatalogLabels";

describe("resolveCatalogOptionLabel", () => {
  const options = [
    { code: "TPAF01", name: "Autotransporte Federal de Carga General" },
    { code: "C2", name: "Camión Unitario (2 llantas)" },
  ];

  it("returns human name for matching code", () => {
    expect(resolveCatalogOptionLabel(options, "TPAF01")).toBe(
      "Autotransporte Federal de Carga General",
    );
  });

  it("never falls back to raw SAT code", () => {
    expect(resolveCatalogOptionLabel(options, "UNKNOWN")).toBeNull();
    expect(resolveCatalogOptionLabel(undefined, "TPAF01")).toBeNull();
    expect(resolveCatalogOptionLabel(options, null)).toBeNull();
    expect(resolveCatalogOptionLabel(options, "  ")).toBeNull();
  });
});
