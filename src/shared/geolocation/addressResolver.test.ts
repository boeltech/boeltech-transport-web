import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@shared/api";

import {
  extractPostalCodeFromLabel,
  fuzzyIncludes,
  normalizeForMatch,
  resolveMapboxToSat,
} from "./addressResolver";

vi.mock("@shared/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const baseInput = {
  label: "Av Industria 120, Parque Industrial, 66600 Apodaca, N.L., México",
  position: { latitude: 25.78, longitude: -100.18 },
};

describe("extractPostalCodeFromLabel", () => {
  it("extracts a 5-digit CP", () => {
    expect(extractPostalCodeFromLabel(baseInput.label)).toBe("66600");
  });

  it("returns null when missing", () => {
    expect(extractPostalCodeFromLabel("Sin código")).toBeNull();
  });
});

describe("normalizeForMatch / fuzzyIncludes", () => {
  it("strips accents and punctuation", () => {
    expect(normalizeForMatch("Nuevo León")).toBe("nuevo leon");
  });

  it("matches when one side includes the other", () => {
    expect(fuzzyIncludes("Apodaca", "Apodaca, N.L.")).toBe(true);
    expect(fuzzyIncludes("Jalisco", "Guadalajara")).toBe(false);
  });
});

describe("resolveMapboxToSat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns high confidence with clear neighborhood match", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        postal_code: "66600",
        state_code: "19",
        state_name: "Nuevo León",
        municipality_code: "006",
        municipality_name: "Apodaca",
        localities: [{ code: "0001", name: "Apodaca" }],
        neighborhoods: [
          { code: "0001", name: "Parque Industrial" },
          { code: "0002", name: "Centro" },
        ],
      },
    });

    const result = await resolveMapboxToSat({
      ...baseInput,
      region: "Nuevo León",
      place: "Apodaca",
      neighborhood: "Parque Industrial",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/catalogs/sat/by-postal-code/66600",
    );
    expect(result.confidence).toBe("high");
    expect(result.ambiguities).toEqual([]);
    expect(result.resolved).toMatchObject({
      postalCode: "66600",
      satStateCode: "19",
      satMunicipalityCode: "006",
      satNeighborhoodCode: "0001",
      neighborhoodName: "Parque Industrial",
      latitude: 25.78,
      longitude: -100.18,
    });
  });

  it("puts neighborhood in ambiguities when multiple without clear match", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        postal_code: "66600",
        state_code: "19",
        state_name: "Nuevo León",
        municipality_code: "006",
        municipality_name: "Apodaca",
        localities: [],
        neighborhoods: [
          { code: "0001", name: "Parque Industrial" },
          { code: "0002", name: "Centro" },
          { code: "0003", name: "Las Palmas" },
        ],
      },
    });

    const result = await resolveMapboxToSat({
      label: "Calle Sin Colonia, 66600 Apodaca, N.L.",
      place: "Apodaca",
      region: "Nuevo León",
      position: baseInput.position,
    });

    expect(result.ambiguities).toContain("neighborhood");
    expect(result.resolved.satNeighborhoodCode).toBeUndefined();
    expect(result.confidence).toBe("medium");
  });

  it("returns low confidence when CP cannot be extracted", async () => {
    const result = await resolveMapboxToSat({
      label: "Somewhere without postal code",
      position: baseInput.position,
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.confidence).toBe("low");
    expect(result.ambiguities).toContain("postalCode");
  });

  it("returns low confidence on 404 catalog lookup", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ status: 404 });

    const result = await resolveMapboxToSat({
      label: "Mystery 00000 Place",
      postalCode: "00000",
      position: baseInput.position,
    });

    expect(result.confidence).toBe("low");
    expect(result.ambiguities).toContain("postalCode");
  });
});
