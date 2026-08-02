import { describe, expect, it } from "vitest";
import type { CatalogOption } from "@features/catalogs";
import { resolveAddressCatalogLabel } from "./useClientAddressLocationLabels";

describe("resolveAddressCatalogLabel", () => {
  const options: CatalogOption[] = [
    { code: "JAL", name: "Jalisco" },
    { code: "014", name: "Guadalajara" },
  ];

  it("resuelve nombre humano y no el código", () => {
    expect(resolveAddressCatalogLabel(options, "JAL")).toBe("Jalisco");
    expect(resolveAddressCatalogLabel(options, "014")).toBe("Guadalajara");
  });

  it("no expone el código cuando no hay match", () => {
    expect(resolveAddressCatalogLabel(options, "XXX")).toBeNull();
  });

  it("ignora vacío", () => {
    expect(resolveAddressCatalogLabel(options, "  ")).toBeNull();
    expect(resolveAddressCatalogLabel(options, null)).toBeNull();
  });
});
