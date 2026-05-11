import { describe, expect, it } from "vitest";
import {
  applySegmentDistanceResultsToStops,
  buildRouteSegmentsForBatch,
  hasManualSegmentDistances,
} from "./stopDistanceHelpers";
import type { TripStopFormValues } from "./validation";

function buildBaseStop(
  overrides: Partial<TripStopFormValues> = {},
): TripStopFormValues {
  return {
    sequenceOrder: 0,
    stopType: ["origin", "pickup"],
    clientId: "",
    clientAddressId: "",
    addressId: "",
    locationName: "Test",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    postalCode: "",
    satLocalityCode: "",
    satNeighborhoodCode: "",
    cityName: "",
    neighborhoodName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    reference: "",
    latitude: 19.4326,
    longitude: -99.1332,
    rfcRemitenteDestinatario: "",
    nombreRemitenteDestinatario: "",
    deliveryRfcRemitenteDestinatario: "",
    deliveryNombreRemitenteDestinatario: "",
    remitentePartnerId: "",
    destinatarioPartnerId: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    distanceFromPreviousKm: undefined,
    ...overrides,
  };
}

describe("stopDistanceHelpers — batch route recalc", () => {
  it("hasManualSegmentDistances is true when a non-origin stop is manual", () => {
    const stops: TripStopFormValues[] = [
      buildBaseStop({ sequenceOrder: 0 }),
      buildBaseStop({
        sequenceOrder: 1,
        stopType: ["destination", "delivery"],
        distanceSource: "manual",
        distanceFromPreviousKm: 100,
      }),
    ];
    expect(hasManualSegmentDistances(stops)).toBe(true);
  });

  it("buildRouteSegmentsForBatch only includes pairs with full coordinates", () => {
    const stops: TripStopFormValues[] = [
      buildBaseStop({ sequenceOrder: 0, latitude: 19, longitude: -99 }),
      buildBaseStop({
        sequenceOrder: 1,
        stopType: ["waypoint", "pickup"],
        latitude: null as unknown as number,
        longitude: null as unknown as number,
      }),
      buildBaseStop({
        sequenceOrder: 2,
        stopType: ["destination", "delivery"],
        latitude: 21,
        longitude: -88,
      }),
    ];
    const { segments, stopIndices } = buildRouteSegmentsForBatch(stops);
    expect(segments).toHaveLength(0);
    expect(stopIndices).toHaveLength(0);
  });

  it("buildRouteSegmentsForBatch maps consecutive geolocated stops", () => {
    const stops: TripStopFormValues[] = [
      buildBaseStop({ sequenceOrder: 0, latitude: 19, longitude: -99 }),
      buildBaseStop({
        sequenceOrder: 1,
        stopType: ["destination", "delivery"],
        latitude: 20,
        longitude: -89,
      }),
    ];
    const { segments, stopIndices } = buildRouteSegmentsForBatch(stops);
    expect(segments).toHaveLength(1);
    expect(stopIndices).toEqual([1]);
    expect(segments[0]?.origin.latitude).toBe(19);
    expect(segments[0]?.destination.latitude).toBe(20);
  });

  it("applySegmentDistanceResultsToStops writes km and metadata", () => {
    const stops: TripStopFormValues[] = [
      buildBaseStop({ sequenceOrder: 0 }),
      buildBaseStop({
        sequenceOrder: 1,
        stopType: ["destination", "delivery"],
        latitude: 20,
        longitude: -89,
      }),
    ];
    const updated = applySegmentDistanceResultsToStops(
      stops,
      [1],
      [
        {
          distanceKm: 42,
          durationSeconds: null,
          provider: "mapbox",
          source: "mapbox_matrix",
          confidence: "high",
          computedAt: "2026-05-09T00:00:00.000Z",
        },
      ],
    );
    expect(updated[1]?.distanceFromPreviousKm).toBe(42);
    expect(updated[1]?.distanceSource).toBe("mapbox_matrix");
    expect(updated[1]?.distanceProvider).toBe("mapbox");
  });
});
