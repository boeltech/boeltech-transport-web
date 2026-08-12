import { describe, expect, it } from "vitest";
import { resolveGeolocationUxStatus } from "./geolocationUxStatus";

describe("resolveGeolocationUxStatus", () => {
  it("prioritizes searching over other states", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: true,
        candidateCount: 3,
        selectedCandidateValue: "",
        hasCoordinates: true,
      }),
    ).toBe("searching");
  });

  it("asks to pick when multiple candidates and none selected", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 2,
        selectedCandidateValue: "",
        hasCoordinates: false,
      }),
    ).toBe("pick");
  });

  it("confirms when coordinates exist and no pending pick", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: true,
      }),
    ).toBe("confirmed");
  });

  it("is empty without coordinates or pending search", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: false,
      }),
    ).toBe("empty");
  });
});
