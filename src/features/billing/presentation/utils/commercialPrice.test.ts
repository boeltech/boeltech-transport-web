import { describe, expect, it } from "vitest";
import {
  isCatalogItemInEaWindow,
  resolveCatalogListPrice,
} from "./commercialPrice";
import type { BillingCatalogItem } from "../../domain/entities";

const catalogItem = (
  overrides: Partial<BillingCatalogItem> & Pick<BillingCatalogItem, "code">,
): BillingCatalogItem => ({
  name: overrides.code,
  kind: "addon",
  isActiveForTenant: false,
  memberCodes: [],
  priceEaCents: 5900,
  priceGaCents: 10900,
  maturity: "beta",
  ...overrides,
});

describe("commercialPrice utils", () => {
  it("resolves EA for beta addon", () => {
    const item = catalogItem({ code: "internal_staff_compensation" });
    const map = new Map([[item.code, item]]);
    expect(resolveCatalogListPrice(item, map)).toEqual({
      cents: 5900,
      tier: "ea",
    });
  });

  it("resolves EA for pack with beta members", () => {
    const member = catalogItem({ code: "asset_register" });
    const pack = catalogItem({
      code: "minipack_activos",
      kind: "minipack",
      priceEaCents: 12500,
      priceGaCents: 22900,
      memberCodes: ["asset_register", "vehicle_docs"],
    });
    const map = new Map([
      [member.code, member],
      [pack.code, pack],
    ]);
    expect(isCatalogItemInEaWindow(pack, map)).toBe(true);
    expect(resolveCatalogListPrice(pack, map).tier).toBe("ea");
  });

  it("pack with maturity beta uses EA in preview without member catalog rows", () => {
    const pack = catalogItem({
      code: "pack_costo_vehicular",
      kind: "pack",
      priceEaCents: 64900,
      priceGaCents: 119900,
      memberCodes: ["missing_member"],
      maturity: "beta",
    });
    const map = new Map([[pack.code, pack]]);
    expect(resolveCatalogListPrice(pack, map)).toEqual({
      cents: 64900,
      tier: "ea",
    });
  });
});
