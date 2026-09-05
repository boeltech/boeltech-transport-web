import { describe, expect, it } from "vitest";
import {
  candidateListSignature,
  shouldFitCandidateBounds,
  type GeolocationCandidateMarker,
} from "./AddressGeolocationMap";

const candidatesA: GeolocationCandidateMarker[] = [
  { latitude: 19.4, longitude: -99.1, label: "A" },
  { latitude: 19.41, longitude: -99.11, label: "B" },
];

const candidatesB: GeolocationCandidateMarker[] = [
  { latitude: 19.5, longitude: -99.2, label: "C" },
  { latitude: 19.51, longitude: -99.21, label: "D" },
];

describe("candidateListSignature / shouldFitCandidateBounds", () => {
  it("returns null for empty or single-candidate lists", () => {
    expect(candidateListSignature(undefined)).toBeNull();
    expect(candidateListSignature([])).toBeNull();
    expect(
      candidateListSignature([{ latitude: 1, longitude: 2, label: "solo" }]),
    ).toBeNull();
  });

  it("builds a stable signature for multi-candidate lists", () => {
    const sig = candidateListSignature(candidatesA);
    expect(sig).toBe(
      "19.400000,-99.100000:A|19.410000,-99.110000:B",
    );
    expect(candidateListSignature(candidatesA)).toBe(sig);
  });

  it("fits bounds only when the candidate list is new", () => {
    const sigA = candidateListSignature(candidatesA);
    const sigB = candidateListSignature(candidatesB);

    expect(shouldFitCandidateBounds(null, sigA)).toBe(true);
    expect(shouldFitCandidateBounds(sigA, sigA)).toBe(false);
    expect(shouldFitCandidateBounds(sigA, sigB)).toBe(true);
    expect(shouldFitCandidateBounds(sigA, null)).toBe(false);
  });
});
