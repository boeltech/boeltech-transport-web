import { describe, expect, it } from "vitest";

import {
  detectPossibleDuplicates,
  levenshtein,
  type DuplicateCandidate,
} from "./detectPossibleDuplicates";

const base: DuplicateCandidate = {
  id: "draft-1",
  postalCode: "44100",
  street: "Av Industria",
  exteriorNumber: "120",
  latitude: 20.67,
  longitude: -103.35,
};

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("counts single edits", () => {
    expect(levenshtein("calle", "calla")).toBe(1);
    expect(levenshtein("av", "av1")).toBe(1);
  });
});

describe("detectPossibleDuplicates", () => {
  it("flags similar street+exterior with same postal code", () => {
    const existing: DuplicateCandidate[] = [
      {
        id: "existing-1",
        postalCode: "44100",
        street: "Av Industria",
        exteriorNumber: "122",
        latitude: null,
        longitude: null,
      },
    ];

    const warnings = detectPossibleDuplicates(base, existing);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.reason).toBe("similar_address");
    expect(warnings[0]?.candidateId).toBe("existing-1");
  });

  it("does not flag dissimilar streets with same postal code", () => {
    const existing: DuplicateCandidate[] = [
      {
        id: "existing-2",
        postalCode: "44100",
        street: "Blvd Completamente Distinto",
        exteriorNumber: "999",
      },
    ];

    expect(detectPossibleDuplicates(base, existing)).toHaveLength(0);
  });

  it("flags nearby geo within 200 m", () => {
    const existing: DuplicateCandidate[] = [
      {
        id: "nearby-1",
        postalCode: "99999",
        street: "Otra Calle",
        exteriorNumber: "1",
        // ~111 m north of base (~0.001 deg lat)
        latitude: 20.671,
        longitude: -103.35,
      },
    ];

    const warnings = detectPossibleDuplicates(base, existing);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.reason).toBe("nearby_geo");
    expect(warnings[0]?.distanceMeters).toBeLessThanOrEqual(200);
  });

  it("does not flag distant geo", () => {
    const existing: DuplicateCandidate[] = [
      {
        id: "far-1",
        postalCode: "99999",
        street: "Otra Calle",
        exteriorNumber: "1",
        latitude: 21.0,
        longitude: -103.35,
      },
    ];

    expect(detectPossibleDuplicates(base, existing)).toHaveLength(0);
  });

  it("skips comparing a candidate to itself by id", () => {
    const warnings = detectPossibleDuplicates(base, [base]);
    expect(warnings).toHaveLength(0);
  });
});
