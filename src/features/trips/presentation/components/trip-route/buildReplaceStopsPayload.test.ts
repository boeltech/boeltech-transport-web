import { describe, expect, it } from "vitest";

import { StopType, type ClientCorridor, type TripStop } from "@features/trips/domain";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

import {
  addressSearchItemToCreateStopInput,
  buildReplaceStopsPayload,
  canPersistComposerStops,
  fillMissingCreateStopDistances,
  isDuplicateComposerEndpointAddress,
  mapTripStopToStopFormData,
  mergeComposerEndpointDraft,
  replaceStopsFromCorridor,
  upsertComposerStop,
} from "./buildReplaceStopsPayload";
import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";

const pickerItem: AddressSearchListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerType: "client",
  ownerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  ownerLabel: "Cliente Alpha",
  addressType: "shipping",
  locationName: "Bodega Alpha",
  street: "Av Cliente",
  exteriorNumber: "1",
  postalCode: "44100",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  neighborhoodName: null,
  satNeighborhoodCode: null,
  latitude: 20.67,
  longitude: -103.35,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const santaFe = { latitude: 19.357, longitude: -99.259 };
const elMarques = { latitude: 20.624, longitude: -100.241 };
const zayulita = { latitude: 20.784, longitude: -105.518 };

const originToDestKm = estimateRoadDistanceKm(
  santaFe.latitude,
  santaFe.longitude,
  zayulita.latitude,
  zayulita.longitude,
)!;
const originToWaypointKm = estimateRoadDistanceKm(
  santaFe.latitude,
  santaFe.longitude,
  elMarques.latitude,
  elMarques.longitude,
)!;
const waypointToDestKm = estimateRoadDistanceKm(
  elMarques.latitude,
  elMarques.longitude,
  zayulita.latitude,
  zayulita.longitude,
)!;

function tripStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN, StopType.PICKUP],
    addressId: null,
    clientId: "cli-1",
    clientAddressId: null,
    sourceAddressId: "11111111-1111-4111-8111-111111111111",
    address: "Bodega Alpha",
    city: "Bodega Alpha",
    state: "JAL",
    postalCode: "44100",
    latitude: 20.67,
    longitude: -103.35,
    locationName: "Bodega Alpha",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: "Av Cliente",
    exteriorNumber: "1",
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: "JAL",
    satMunicipioCode: "039",
    satLocalidadCode: null,
    satColoniaCode: null,
    rfcRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
    deliveryRfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    remitentePartnerId: null,
    destinatarioPartnerId: null,
    distanceFromPreviousKm: null,
    distanceSource: null,
    distanceProvider: null,
    distanceConfidence: null,
    distanceComputedAt: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides,
  };
}

describe("addressSearchItemToCreateStopInput", () => {
  it("sends sourceAddressId and catalog snapshot without inventing RFC", () => {
    const input = addressSearchItemToCreateStopInput(pickerItem, "origin", 1);

    expect(input.sourceAddressId).toBe(pickerItem.id);
    expect(input.postalCode).toBe("44100");
    expect(input.satStateCode).toBe("JAL");
    expect(input.locationName).toBe("Bodega Alpha");
    expect(input.stopType).toEqual([StopType.ORIGIN, StopType.PICKUP]);
    expect(input.rfcRemitenteDestinatario).toBeUndefined();
  });
});

describe("upsertComposerStop", () => {
  it("puts origin then destination on the line", () => {
    const withOrigin = upsertComposerStop({
      existingStops: [],
      category: "origin",
      item: pickerItem,
    });
    expect(withOrigin).toHaveLength(1);
    expect(withOrigin[0]?.stopType).toContain(StopType.ORIGIN);

    const both = upsertComposerStop({
      existingStops: [tripStop()],
      category: "destination",
      item: { ...pickerItem, id: "22222222-2222-4222-8222-222222222222", locationName: "CEDIS Sur" },
    });
    expect(both).toHaveLength(2);
    expect(both[0]?.sourceAddressId).toBe(pickerItem.id);
    expect(both[1]?.locationName).toBe("CEDIS Sur");
    expect(both[1]?.stopType).toContain(StopType.DESTINATION);
    expect(both[0]?.sequenceOrder).toBe(1);
    expect(both[1]?.sequenceOrder).toBe(2);
  });

  it("fills destination distance from consecutive coordinates", () => {
    const destItem: AddressSearchListItem = {
      ...pickerItem,
      id: "22222222-2222-4222-8222-222222222222",
      locationName: "CEDIS Sur",
      latitude: 25.67,
      longitude: -100.32,
    };
    const both = upsertComposerStop({
      existingStops: [tripStop()],
      category: "destination",
      item: destItem,
    });
    expect(both[1]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(both[1]?.distanceSource).toBe("haversine_fallback");
    expect(both[0]?.distanceFromPreviousKm).toBeUndefined();
  });

  it("inserts waypoint before destination and recalculates both segments", () => {
    const origin = tripStop({
      ...santaFe,
      locationName: "Santa Fe CDMX",
    });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Zayulita",
      ...zayulita,
      distanceFromPreviousKm: originToDestKm,
      distanceSource: "haversine_fallback",
    });
    const next = upsertComposerStop({
      existingStops: [origin, dest],
      category: "waypoint",
      item: {
        ...pickerItem,
        id: "33333333-3333-4333-8333-333333333333",
        locationName: "El Marques",
        ...elMarques,
      },
    });
    expect(next).toHaveLength(3);
    expect(next[1]?.locationName).toBe("El Marques");
    expect(next[1]?.stopType).toEqual([StopType.WAYPOINT]);
    expect(next[2]?.stopType).toContain(StopType.DESTINATION);
    expect(next[1]?.distanceFromPreviousKm).toBe(originToWaypointKm);
    expect(next[2]?.distanceFromPreviousKm).toBe(waypointToDestKm);
    expect(next[2]?.distanceFromPreviousKm).not.toBe(originToDestKm);
    expect(originToDestKm).toBeGreaterThan(waypointToDestKm);
    expect(originToDestKm).toBeGreaterThan(originToWaypointKm);
  });

  it("inserts a second waypoint before destination", () => {
    const origin = tripStop({ ...santaFe });
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      locationName: "El Marques",
      ...elMarques,
      distanceFromPreviousKm: originToWaypointKm,
    });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Zayulita",
      ...zayulita,
      distanceFromPreviousKm: waypointToDestKm,
    });
    const next = upsertComposerStop({
      existingStops: [origin, waypoint, dest],
      category: "waypoint",
      item: {
        ...pickerItem,
        id: "44444444-4444-4444-8444-444444444444",
        locationName: "Guadalajara",
        latitude: 20.67,
        longitude: -103.35,
      },
    });
    expect(next.map((stop) => stop.locationName)).toEqual([
      "Bodega Alpha",
      "El Marques",
      "Guadalajara",
      "Zayulita",
    ]);
    expect(next[3]?.stopType).toContain(StopType.DESTINATION);
    expect(next[2]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(next[3]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(next[3]?.distanceFromPreviousKm).not.toBe(waypointToDestKm);
  });

  it("inserts waypoint before the last stop when destination type is missing", () => {
    const origin = tripStop({ ...santaFe, locationName: "Santa Fe CDMX" });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DELIVERY],
      locationName: "Zayulita",
      ...zayulita,
      distanceFromPreviousKm: originToDestKm,
    });
    const next = upsertComposerStop({
      existingStops: [origin, dest],
      category: "waypoint",
      item: {
        ...pickerItem,
        id: "33333333-3333-4333-8333-333333333333",
        locationName: "El Marques",
        ...elMarques,
      },
    });
    expect(next.map((stop) => stop.locationName)).toEqual([
      "Santa Fe CDMX",
      "El Marques",
      "Zayulita",
    ]);
    expect(next[1]?.distanceFromPreviousKm).toBe(originToWaypointKm);
    expect(next[2]?.distanceFromPreviousKm).toBe(waypointToDestKm);
  });
});

describe("replaceStopsFromCorridor", () => {
  it("clones corridor snapshot as replace payload", () => {
    const corridor: ClientCorridor = {
      corridorKey: "cdmx-mty",
      originCity: "CDMX",
      originState: "CMX",
      destinationCity: "MTY",
      destinationState: "NLE",
      stopCount: 2,
      tripCount: 4,
      lastUsedAt: "2026-08-10T18:00:00.000Z",
      sampleTripId: "trip-sample",
      stopsSnapshot: [
        {
          sequenceOrder: 3,
          stopType: [StopType.ORIGIN],
          sourceAddressId: "addr-1",
          city: "CDMX",
          locationName: "CEDIS Norte",
        },
        {
          sequenceOrder: 9,
          stopType: [StopType.DESTINATION],
          city: "Monterrey",
          locationName: "Patio Sur",
        },
      ],
    };

    const stops = replaceStopsFromCorridor(corridor);
    expect(stops).toHaveLength(2);
    expect(stops[0]?.sequenceOrder).toBe(1);
    expect(stops[0]?.sourceAddressId).toBe("addr-1");
    expect(stops[1]?.sequenceOrder).toBe(2);
  });

  it("fills haversine segment km when snapshot has coordinates", () => {
    const corridor: ClientCorridor = {
      corridorKey: "cdmx-mty",
      originCity: "CDMX",
      originState: "CMX",
      destinationCity: "MTY",
      destinationState: "NLE",
      stopCount: 2,
      tripCount: 4,
      lastUsedAt: "2026-08-10T18:00:00.000Z",
      sampleTripId: "trip-sample",
      stopsSnapshot: [
        {
          sequenceOrder: 1,
          stopType: [StopType.ORIGIN],
          city: "CDMX",
          locationName: "Santa Fe",
          latitude: santaFe.latitude,
          longitude: santaFe.longitude,
        },
        {
          sequenceOrder: 2,
          stopType: [StopType.DESTINATION],
          city: "Zayulita",
          locationName: "Zayulita",
          latitude: zayulita.latitude,
          longitude: zayulita.longitude,
        },
      ],
    };

    const stops = replaceStopsFromCorridor(corridor);
    expect(stops[0]?.distanceFromPreviousKm).toBeUndefined();
    expect(stops[1]?.distanceFromPreviousKm).toBe(originToDestKm);
    expect(stops[1]?.distanceSource).toBe("haversine_fallback");
  });
});

describe("mergeComposerEndpointDraft", () => {
  it("keeps a single endpoint until both are chosen", () => {
    const onlyOrigin = mergeComposerEndpointDraft({
      existingStops: [],
      draft: { origin: pickerItem },
    });
    expect(onlyOrigin).toHaveLength(1);
    expect(canPersistComposerStops(onlyOrigin)).toBe(false);

    const both = mergeComposerEndpointDraft({
      existingStops: [],
      draft: {
        origin: pickerItem,
        destination: {
          ...pickerItem,
          id: "22222222-2222-4222-8222-222222222222",
          locationName: "CEDIS Sur",
        },
      },
    });
    expect(both).toHaveLength(2);
    expect(canPersistComposerStops(both)).toBe(true);
    expect(both[1]?.locationName).toBe("CEDIS Sur");
  });
});

describe("mergeSubmittedStopWithEndpointDraft", () => {
  it("PUTs origin from the form together with destination still in the picker draft", () => {
    const destItem: AddressSearchListItem = {
      ...pickerItem,
      id: "22222222-2222-4222-8222-222222222222",
      locationName: "Domicilio fiscal",
    };
    const next = buildReplaceStopsPayload({
      existingStops: [],
      submitted: {
        stopCategory: "origin",
        stopType: [StopType.ORIGIN, StopType.PICKUP],
        locationName: "Tecnológico de Monterrey",
        cityName: "Monterrey",
        satCountryCode: "MEX",
        satStateCode: "NLE",
        satMunicipalityCode: "039",
        postalCode: "64700",
        street: "Av Eugenio Garza Sada",
        exteriorNumber: "2501",
        latitude: 25.65,
        longitude: -100.29,
      },
      endpointDraft: { destination: destItem },
    });
    expect(next).toHaveLength(2);
    expect(canPersistComposerStops(next)).toBe(true);
    expect(next[0]?.locationName).toBe("Tecnológico de Monterrey");
    expect(next[0]?.stopType).toContain(StopType.ORIGIN);
    expect(next[1]?.locationName).toBe("Domicilio fiscal");
    expect(next[1]?.stopType).toContain(StopType.DESTINATION);
    expect(next[1]?.sourceAddressId).toBe(destItem.id);
  });
});

describe("fillMissingCreateStopDistances", () => {
  it("does not overwrite a manual segment distance", () => {
    const filled = fillMissingCreateStopDistances([
      {
        sequenceOrder: 1,
        stopType: [StopType.ORIGIN],
        address: "A",
        city: "GDL",
        latitude: 20.67,
        longitude: -103.35,
      },
      {
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        address: "B",
        city: "MTY",
        latitude: 25.67,
        longitude: -100.32,
        distanceFromPreviousKm: 99,
        distanceSource: "manual",
      },
    ]);
    expect(filled[1]?.distanceFromPreviousKm).toBe(99);
    expect(filled[1]?.distanceSource).toBe("manual");
  });

  it("recomputes a stale haversine segment when the previous stop changes", () => {
    const filled = fillMissingCreateStopDistances([
      {
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        address: "QRO",
        city: "QRO",
        ...elMarques,
      },
      {
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        address: "NAY",
        city: "NAY",
        ...zayulita,
        distanceFromPreviousKm: originToDestKm,
        distanceSource: "haversine_fallback",
      },
    ]);
    expect(filled[1]?.distanceFromPreviousKm).toBe(waypointToDestKm);
    expect(filled[1]?.distanceFromPreviousKm).not.toBe(originToDestKm);
  });
});

describe("buildReplaceStopsPayload", () => {
  it("reorders a waypoint persisted after destination and recalculates segments", () => {
    const origin = tripStop({ ...santaFe, locationName: "Santa Fe CDMX" });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Zayulita",
      ...zayulita,
      distanceFromPreviousKm: originToDestKm,
      distanceSource: "haversine_fallback",
    });
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 3,
      stopType: [StopType.WAYPOINT],
      locationName: "El Marques",
      ...elMarques,
      distanceFromPreviousKm: waypointToDestKm,
      distanceSource: "haversine_fallback",
    });
    const next = buildReplaceStopsPayload({
      existingStops: [origin, dest, waypoint],
      submitted: {
        ...mapTripStopToStopFormData(dest),
        stopCategory: "destination",
      },
      editingStopId: dest.id,
    });
    expect(next.map((stop) => stop.locationName)).toEqual([
      "Santa Fe CDMX",
      "El Marques",
      "Zayulita",
    ]);
    expect(next[1]?.distanceFromPreviousKm).toBe(originToWaypointKm);
    expect(next[2]?.distanceFromPreviousKm).toBe(waypointToDestKm);
  });

  it("creates a waypoint before destination instead of appending", () => {
    const origin = tripStop({ ...santaFe, locationName: "Santa Fe CDMX" });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Zayulita",
      ...zayulita,
      distanceFromPreviousKm: originToDestKm,
      distanceSource: "haversine_fallback",
    });
    const next = buildReplaceStopsPayload({
      existingStops: [origin, dest],
      submitted: {
        stopCategory: "waypoint",
        stopType: [StopType.WAYPOINT],
        locationName: "El Marques",
        cityName: "Queretaro",
        satCountryCode: "MEX",
        satStateCode: "QUE",
        satMunicipalityCode: "011",
        postalCode: "76240",
        ...elMarques,
      },
    });
    expect(next.map((stop) => stop.locationName)).toEqual([
      "Santa Fe CDMX",
      "El Marques",
      "Zayulita",
    ]);
    expect(next[1]?.distanceFromPreviousKm).toBe(originToWaypointKm);
    expect(next[2]?.distanceFromPreviousKm).toBe(waypointToDestKm);
  });
});

describe("mapStopToReplaceStopInput", () => {
  it("omits owned addressId so replace can recreate snapshot", () => {
    const input = mapStopToReplaceStopInput(
      tripStop({
        addressId: "8e100ce1-718f-4012-8135-5ac616ad4980",
        sourceAddressId: pickerItem.id,
      }),
    );
    expect(input).not.toHaveProperty("addressId");
    expect(input.sourceAddressId).toBe(pickerItem.id);
    expect(input.postalCode).toBe("44100");
  });
});

describe("isDuplicateComposerEndpointAddress", () => {
  it("blocks the same catalog id on origin and destination", () => {
    expect(
      isDuplicateComposerEndpointAddress({
        category: "destination",
        catalogAddressId: pickerItem.id,
        existingStops: [],
        draft: { origin: pickerItem },
      }),
    ).toBe(true);

    expect(
      isDuplicateComposerEndpointAddress({
        category: "origin",
        catalogAddressId: pickerItem.id,
        existingStops: [
          tripStop(),
          tripStop({
            id: "stop-2",
            sequenceOrder: 2,
            stopType: [StopType.DESTINATION, StopType.DELIVERY],
            sourceAddressId: pickerItem.id,
          }),
        ],
        draft: {},
      }),
    ).toBe(true);

    expect(
      isDuplicateComposerEndpointAddress({
        category: "destination",
        catalogAddressId: "22222222-2222-4222-8222-222222222222",
        existingStops: [tripStop()],
        draft: {},
      }),
    ).toBe(false);
  });
});

describe("upsertComposerStop replace payload", () => {
  it("does not re-send sibling addressId when replacing origin", () => {
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      addressId: "8e100ce1-718f-4012-8135-5ac616ad4980",
      sourceAddressId: "22222222-2222-4222-8222-222222222222",
      locationName: "CEDIS Sur",
    });
    const next = upsertComposerStop({
      existingStops: [tripStop(), dest],
      category: "origin",
      item: {
        ...pickerItem,
        id: "33333333-3333-4333-8333-333333333333",
        locationName: "Nuevo origen",
      },
    });
    expect(next).toHaveLength(2);
    expect(next[0]?.addressId).toBeUndefined();
    expect(next[1]?.addressId).toBeUndefined();
    expect(next[1]?.sourceAddressId).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
  });
});
