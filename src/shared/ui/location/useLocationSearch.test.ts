import { describe, expect, it } from "vitest";

import { isLikelyPastedAddress } from "./useLocationSearch";

describe("isLikelyPastedAddress", () => {
  it("detects Google Maps paste with CP", () => {
    expect(
      isLikelyPastedAddress(
        "Calz. Gral. Mariano Escobedo 145, Anáhuac I Secc, Miguel Hidalgo, 11320 Ciudad de México, CDMX",
      ),
    ).toBe(true);
  });

  it("treats short typeahead as not paste", () => {
    expect(isLikelyPastedAddress("Escobedo")).toBe(false);
    expect(isLikelyPastedAddress("Av Reforma")).toBe(false);
  });
});
