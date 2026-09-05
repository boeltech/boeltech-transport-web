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

  it("keeps confirmed when pin exists even if multi-candidate selection cleared", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 2,
        selectedCandidateValue: "",
        hasCoordinates: true,
      }),
    ).toBe("confirmed");
  });

  it("confirms when coordinates exist and no CP warning", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: true,
      }),
    ).toBe("confirmed");
  });

  it("returns pending_confirmation when coordinates exist but CP warning active", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: true,
        hasCpWarning: true,
      }),
    ).toBe("pending_confirmation");
  });

  it("returns ready_to_locate when address has minimal data but no coords", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: false,
        hasMinimalAddressData: true,
      }),
    ).toBe("ready_to_locate");
  });

  it("is empty without coordinates or minimal address data", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: false,
      }),
    ).toBe("empty");
  });

  it("is empty when hasMinimalAddressData is false", () => {
    expect(
      resolveGeolocationUxStatus({
        isGeocoding: false,
        candidateCount: 0,
        selectedCandidateValue: "",
        hasCoordinates: false,
        hasMinimalAddressData: false,
      }),
    ).toBe("empty");
  });
});
