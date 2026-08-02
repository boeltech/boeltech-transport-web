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

  it("mantiene product-preview desactivado hasta drop-in del archivo", () => {
    expect(isCommercialAssetEnabled("product-preview-dashboard")).toBe(false);
    expect(commercialAssets["og-default"].enabled).toBe(false);
  });
});
