import { describe, expect, it } from "vitest";
import {
  commercialAssets,
  getCommercialAsset,
  isCommercialAssetEnabled,
} from "./commercialAssets";

describe("commercialAssets", () => {
  it("expone ids estables con shape completo", () => {
    const asset = getCommercialAsset("product-preview-dashboard");
    expect(asset.id).toBe("product-preview-dashboard");
    expect(asset.src).toMatch(/^\/commercial\/product\//);
    expect(asset.kind).toBe("product-preview");
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);
    expect(asset.alt.length).toBeGreaterThan(0);
  });

  it("activa crops A3 de evidencia (fleet/trips/clients/billing + dashboard)", () => {
    for (const id of [
      "product-preview-dashboard",
      "product-preview-fleet",
      "product-preview-trips",
      "product-preview-clients",
      "product-preview-billing",
    ] as const) {
      expect(isCommercialAssetEnabled(id)).toBe(true);
      expect(commercialAssets[id].src).toMatch(/\.png$/);
    }
    expect(commercialAssets["og-default"].enabled).toBe(false);
  });
});
