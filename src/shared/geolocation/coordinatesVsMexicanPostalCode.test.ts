import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  CP_COORDINATES_WARNING_THRESHOLD_KM,
  evaluateCoordinatesVsMexicanPostalCodeWarning,
  isDistanceFarFromPostalCodeReference,
  isMexicanPostalCodeForWarning,
  parseCoordinateValue,
  resolveMexicanPostalCodeReference,
} from "./coordinatesVsMexicanPostalCode";

vi.mock("@shared/geolocation/infrastructure/postalCodeReferenceApi", () => ({
  fetchPostalCodeReference: vi.fn(),
}));

import { fetchPostalCodeReference } from "@shared/geolocation/infrastructure/postalCodeReferenceApi";

describe("coordinatesVsMexicanPostalCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isMexicanPostalCodeForWarning accepts MEX + 5-digit CP", () => {
    expect(isMexicanPostalCodeForWarning("76240", "MEX")).toBe(true);
    expect(isMexicanPostalCodeForWarning("76240", "MX")).toBe(true);
    expect(isMexicanPostalCodeForWarning("7624", "MEX")).toBe(false);
    expect(isMexicanPostalCodeForWarning("76240", "USA")).toBe(false);
  });

  it("parseCoordinateValue parses numbers and numeric strings", () => {
    expect(parseCoordinateValue(29.355)).toBe(29.355);
    expect(parseCoordinateValue("-98.5311")).toBe(-98.5311);
    expect(parseCoordinateValue("")).toBeNull();
  });

  it("isDistanceFarFromPostalCodeReference uses threshold", () => {
    expect(isDistanceFarFromPostalCodeReference(150)).toBe(true);
    expect(isDistanceFarFromPostalCodeReference(50)).toBe(false);
    expect(
      isDistanceFarFromPostalCodeReference(
        CP_COORDINATES_WARNING_THRESHOLD_KM + 0.1,
      ),
    ).toBe(true);
  });

  it("resolveMexicanPostalCodeReference uses API postal-code-reference", async () => {
    vi.mocked(fetchPostalCodeReference).mockResolvedValue({
      postalCode: "76240",
      position: { latitude: 20.74, longitude: -100.45 },
      label: "76240, Querétaro",
      queryUsed: "76240",
      resolutionSource: "mapbox_postcode",
      confidence: "high",
      satStateCode: "22",
      satStateName: "Querétaro",
      satMunicipalityCode: "006",
      satMunicipalityName: "El Marqués",
    });

    const ref = await resolveMexicanPostalCodeReference({
      postalCode: "76240",
      satStateCode: "22",
    });
    expect(ref).toEqual({
      label: "76240, Querétaro",
      position: { latitude: 20.74, longitude: -100.45 },
      query: "76240",
      resolutionSource: "mapbox_postcode",
      confidence: "high",
    });
  });

  it("resolveMexicanPostalCodeReference returns null for low confidence", async () => {
    vi.mocked(fetchPostalCodeReference).mockResolvedValue({
      postalCode: "34541",
      position: { latitude: 19.35, longitude: -99.16 },
      label: "CDMX",
      queryUsed: "34541",
      resolutionSource: "mapbox_postcode",
      confidence: "low",
      satStateCode: "10",
      satStateName: "Durango",
      satMunicipalityCode: "032",
      satMunicipalityName: "Topia",
    });

    const ref = await resolveMexicanPostalCodeReference({ postalCode: "34541" });
    expect(ref).toBeNull();
  });

  it("evaluateCoordinatesVsMexicanPostalCodeWarning flags coords far from CP", async () => {
    vi.mocked(fetchPostalCodeReference).mockResolvedValue({
      postalCode: "76240",
      position: { latitude: 20.74, longitude: -100.45 },
      label: "76240, Querétaro",
      queryUsed: "76240",
      resolutionSource: "mapbox_postcode",
      confidence: "high",
      satStateCode: "22",
      satStateName: "Querétaro",
      satMunicipalityCode: "006",
      satMunicipalityName: "El Marqués",
    });

    const warning = await evaluateCoordinatesVsMexicanPostalCodeWarning({
      postalCode: "76240",
      satCountryCode: "MEX",
      latitude: 29.355,
      longitude: -98.5311,
    });

    expect(warning).not.toBeNull();
    expect(warning!.distanceKm).toBeGreaterThan(CP_COORDINATES_WARNING_THRESHOLD_KM);
  });

  it("evaluateCoordinatesVsMexicanPostalCodeWarning returns null when coords are near CP", async () => {
    vi.mocked(fetchPostalCodeReference).mockResolvedValue({
      postalCode: "76240",
      position: { latitude: 20.74, longitude: -100.45 },
      label: "76240, Querétaro",
      queryUsed: "76240",
      resolutionSource: "mapbox_postcode",
      confidence: "high",
      satStateCode: "22",
      satStateName: "Querétaro",
      satMunicipalityCode: "006",
      satMunicipalityName: "El Marqués",
    });

    const warning = await evaluateCoordinatesVsMexicanPostalCodeWarning({
      postalCode: "76240",
      satCountryCode: "MEX",
      latitude: 20.75,
      longitude: -100.44,
    });

    expect(warning).toBeNull();
  });
});
