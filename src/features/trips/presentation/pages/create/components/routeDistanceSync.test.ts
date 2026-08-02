import { describe, expect, it } from "vitest";
import {
  decideSegmentDistanceApply,
  didRouteGeoChange,
} from "./routeDistanceSync";
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

const origin = buildBaseStop({ sequenceOrder: 0 });
const destination = buildBaseStop({
  sequenceOrder: 1,
  stopType: ["destination", "delivery"],
  latitude: 20,
  longitude: -89,
});

describe("didRouteGeoChange", () => {
  it("is false when length and coordinates match", () => {
    expect(didRouteGeoChange([origin, destination], [origin, destination])).toBe(
      false,
    );
  });

  it("is true when length differs", () => {
    expect(didRouteGeoChange([origin, destination], [origin])).toBe(true);
  });

  it("is true when a stop latitude changes", () => {
    const moved = { ...destination, latitude: 21 };
    expect(didRouteGeoChange([origin, destination], [origin, moved])).toBe(true);
  });
});

describe("decideSegmentDistanceApply", () => {
  it("discards stale generation", () => {
    const decision = decideSegmentDistanceApply({
      requestGeneration: 1,
      activeGeneration: 2,
      snapshotStops: [origin, destination],
      latestStops: [origin, destination],
      confirmedOverwrite: false,
    });
    expect(decision).toEqual({ action: "discard_stale" });
  });

  it("requeues when geo changed and generation is active", () => {
    const moved = { ...destination, latitude: 21 };
    const decision = decideSegmentDistanceApply({
      requestGeneration: 3,
      activeGeneration: 3,
      snapshotStops: [origin, destination],
      latestStops: [origin, moved],
      confirmedOverwrite: false,
    });
    expect(decision).toEqual({ action: "requeue_geo_changed" });
  });

  it("discards when latest has manual distances without confirmed overwrite", () => {
    const withManual = {
      ...destination,
      distanceSource: "manual" as const,
      distanceFromPreviousKm: 55,
    };
    const decision = decideSegmentDistanceApply({
      requestGeneration: 1,
      activeGeneration: 1,
      snapshotStops: [origin, destination],
      latestStops: [origin, withManual],
      confirmedOverwrite: false,
    });
    expect(decision).toEqual({ action: "discard_manual_changed" });
  });

  it("applies when generation matches, geo stable, and no blocking manuals", () => {
    const decision = decideSegmentDistanceApply({
      requestGeneration: 1,
      activeGeneration: 1,
      snapshotStops: [origin, destination],
      latestStops: [origin, destination],
      confirmedOverwrite: false,
    });
    expect(decision).toEqual({ action: "apply" });
  });

  it("applies over manuals when overwrite was confirmed", () => {
    const withManual = {
      ...destination,
      distanceSource: "manual" as const,
      distanceFromPreviousKm: 55,
    };
    const decision = decideSegmentDistanceApply({
      requestGeneration: 1,
      activeGeneration: 1,
      snapshotStops: [origin, withManual],
      latestStops: [origin, withManual],
      confirmedOverwrite: true,
    });
    expect(decision).toEqual({ action: "apply" });
  });

  it("prefers stale over geo/manual when generation is outdated", () => {
    const moved = { ...destination, latitude: 21 };
    const decision = decideSegmentDistanceApply({
      requestGeneration: 1,
      activeGeneration: 5,
      snapshotStops: [origin, destination],
      latestStops: [origin, moved],
      confirmedOverwrite: false,
    });
    expect(decision).toEqual({ action: "discard_stale" });
  });
});
