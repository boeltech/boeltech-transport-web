import { describe, expect, it } from "vitest";

import {
  filterOptionsByPostalCodePrefix,
  resolveCatalogCode,
  toShortSatCode,
} from "./satCatalogCodeUtils";

const COLLIDING = [
  { code: "76240-0001", name: "Santa Rita" },
  { code: "76246-0001", name: "Real Solare" },
  { code: "76246-0042", name: "Otra" },
] as const;

describe("toShortSatCode", () => {
  it("returns the last segment of a composite code", () => {
    expect(toShortSatCode("76246-0042")).toBe("0042");
    expect(toShortSatCode("JAL-039")).toBe("039");
  });

  it("returns the value unchanged when there is no dash", () => {
    expect(toShortSatCode("0001")).toBe("0001");
  });
});

describe("resolveCatalogCode", () => {
  it("returns exact match", () => {
    expect(resolveCatalogCode("76246-0042", COLLIDING)).toBe("76246-0042");
  });

  it("does not expand an ambiguous short to the first match", () => {
    expect(resolveCatalogCode("0001", COLLIDING)).toBe("0001");
  });

  it("expands short with postalCode when exactly one CP-prefixed match", () => {
    expect(resolveCatalogCode("0001", COLLIDING, "76246")).toBe("76246-0001");
    expect(resolveCatalogCode("0001", COLLIDING, "76240")).toBe("76240-0001");
  });

  it("expands short when only one option shares that short", () => {
    expect(resolveCatalogCode("0042", COLLIDING)).toBe("76246-0042");
  });

  it("returns empty for blank input", () => {
    expect(resolveCatalogCode("  ", COLLIDING)).toBe("");
  });
});

describe("filterOptionsByPostalCodePrefix", () => {
  it("keeps only options prefixed with the current CP when any match", () => {
    expect(filterOptionsByPostalCodePrefix(COLLIDING, "76246")).toEqual([
      { code: "76246-0001", name: "Real Solare" },
      { code: "76246-0042", name: "Otra" },
    ]);
  });

  it("returns the full list when no option uses the CP prefix", () => {
    const municipal = [
      { code: "0001", name: "Centro" },
      { code: "0002", name: "Norte" },
    ];
    expect(filterOptionsByPostalCodePrefix(municipal, "76246")).toEqual(
      municipal,
    );
  });

  it("returns the full list when postal code is not ready", () => {
    expect(filterOptionsByPostalCodePrefix(COLLIDING, "762")).toEqual([
      ...COLLIDING,
    ]);
  });
});
