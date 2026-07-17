import { describe, expect, it } from "vitest";
import {
  CatalogSource,
  isCatalogItemMutable,
  isCatalogReadOnly,
  isGlobalCatalog,
  isInternalCatalogType,
  isTenantManagedCatalog,
  type CatalogType,
} from "./entities";

function makeType(
  overrides: Partial<Pick<CatalogType, "isGlobal" | "source">> = {},
): Pick<CatalogType, "isGlobal" | "source"> {
  return {
    isGlobal: false,
    source: CatalogSource.INTERNAL,
    ...overrides,
  };
}

describe("catalog tenant policy helpers", () => {
  it("isGlobalCatalog returns true when isGlobal is true", () => {
    expect(isGlobalCatalog(makeType({ isGlobal: true, source: CatalogSource.SAT }))).toBe(
      true,
    );
  });

  it("isInternalCatalogType is the inverse of isGlobal", () => {
    expect(isInternalCatalogType(makeType({ isGlobal: true }))).toBe(false);
    expect(isInternalCatalogType(makeType({ isGlobal: false }))).toBe(true);
  });

  it("isCatalogReadOnly is true for global and internal catalogs", () => {
    expect(
      isCatalogReadOnly(makeType({ isGlobal: true, source: CatalogSource.SAT })),
    ).toBe(true);
    expect(
      isCatalogReadOnly(makeType({ isGlobal: false, source: CatalogSource.INTERNAL })),
    ).toBe(true);
  });

  it("isCatalogItemMutable is false for internal catalogs", () => {
    expect(
      isCatalogItemMutable(makeType({ isGlobal: false, source: CatalogSource.INTERNAL })),
    ).toBe(false);
    expect(isTenantManagedCatalog(makeType())).toBe(false);
  });
});
