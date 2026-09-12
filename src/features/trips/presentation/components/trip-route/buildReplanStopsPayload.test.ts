import { describe, expect, it } from "vitest";

import {
  StopStatus,
  StopType,
  type CreateStopInput,
  type TripStop,
} from "@features/trips/domain";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

import {
  buildReplanAfterRemoveWaypoint,
  buildReplanAfterReorderWaypoint,
  toReplanPendingStops,
} from "./buildReplanStopsPayload";

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

function makeStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN, StopType.PICKUP],
    addressId: null,
    clientId: null,
    clientAddressId: null,
    sourceAddressId: null,
    address: "Calle 1",
    city: "Guadalajara",
    state: "JAL",
    postalCode: "44100",
    latitude: 20.67,
    longitude: -103.35,
    locationName: "Origen",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: StopStatus.PENDING,
    notes: null,
    idUbicacion: null,
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: null,
    satEstadoCode: null,
    satMunicipioCode: null,
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

function makeInput(
  overrides: Partial<CreateStopInput> &
    Pick<CreateStopInput, "sequenceOrder" | "stopType">,
): CreateStopInput {
  return {
    address: "Calle 1",
    city: "Guadalajara",
    locationName: "Origen",
    ...overrides,
  };
}

describe("toReplanPendingStops", () => {
  it("assigns editingStopId when category matches and stop is unique in category", () => {
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      city: "Monterrey",
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Nuevo",
        city: "Monterrey",
        address: "Av Nueva 10",
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [
        makeStop({
          id: "stop-origin",
          status: StopStatus.COMPLETED,
          actualDeparture: "2026-05-01T10:00:00.000Z",
        }),
        dest,
      ],
      editingStopId: "stop-dest",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stop-dest");
    expect(result[0]?.locationName).toBe("CEDIS Nuevo");
  });

  it("matches waypoint by addressId / sourceAddressId", () => {
    const addressId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala",
      city: "Apodaca",
      addressId,
      sourceAddressId: null,
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT, StopType.PICKUP],
        locationName: "Escala editada",
        city: "Apodaca",
        address: "Bodega 2",
        addressId,
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [waypoint],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stop-wp");
  });

  it("matches waypoint by locationName + city when no addressId", () => {
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.DELIVERY],
      locationName: "Escala Norte",
      city: "Apodaca",
      addressId: null,
      sourceAddressId: null,
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT, StopType.DELIVERY],
        locationName: "Escala Norte",
        city: "Apodaca",
        address: "Calle Escala",
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [waypoint],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stop-wp");
  });

  it("inserts without id when no existing match", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      city: "CDMX",
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT, StopType.PICKUP],
        locationName: "Nueva escala",
        city: "Leon",
        address: "Plaza 1",
      }),
      makeInput({
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Destino",
        city: "CDMX",
        address: "Calle Destino",
      }),
    ];

    const result = toReplanPendingStops({ next, existing: [origin, dest] });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBeUndefined();
    expect(result[0]?.locationName).toBe("Nueva escala");
    expect(result[1]?.id).toBe("stop-dest");
  });

  it("omits existing pending stops not present in next (delete by omission)", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala a borrar",
      city: "Apodaca",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      city: "CDMX",
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Destino",
        city: "CDMX",
        address: "Calle Destino",
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [origin, waypoint, dest],
    });

    expect(result.map((stop) => stop.id)).toEqual(["stop-dest"]);
    expect(result.some((stop) => stop.id === "stop-wp")).toBe(false);
  });

  it("excludes immutable stops from output and does not assign their ids", () => {
    const completedOrigin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
      locationName: "Origen locked",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      city: "CDMX",
    });
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.ORIGIN, StopType.PICKUP],
        locationName: "Origen locked",
        city: "Guadalajara",
        address: "Calle 1",
      }),
      makeInput({
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Destino",
        city: "CDMX",
        address: "Calle Destino",
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [completedOrigin, dest],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stop-dest");
    expect(result.some((stop) => stop.id === "stop-origin")).toBe(false);
  });

  it("assigns editingStopId by route-line order after origin→wp→dest reorder", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
      ...santaFe,
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Zayulita",
      city: "PV",
      ...zayulita,
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 3,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "El Marques",
      city: "QRO",
      addressId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ...elMarques,
    });
    // next ya en orden de ruta (como finalizeReplaceStopsPayload)
    const newAddressId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const next = [
      makeInput({
        sequenceOrder: 1,
        stopType: [StopType.ORIGIN, StopType.PICKUP],
        locationName: "Origen",
        ...santaFe,
      }),
      makeInput({
        sequenceOrder: 2,
        stopType: [StopType.WAYPOINT, StopType.PICKUP],
        locationName: "El Marques editado",
        city: "QRO",
        address: "Bodega nueva",
        addressId: newAddressId,
        ...elMarques,
      }),
      makeInput({
        sequenceOrder: 3,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Zayulita",
        city: "PV",
        ...zayulita,
      }),
    ];

    const result = toReplanPendingStops({
      next,
      existing: [origin, dest, waypoint],
      editingStopId: "stop-wp",
    });

    const edited = result.find((stop) => stop.id === "stop-wp");
    expect(edited).toBeDefined();
    expect(edited?.locationName).toBe("El Marques editado");
    expect(edited?.addressId).toBe(newAddressId);
    expect(result.some((stop) => !stop.id && stop.locationName === "El Marques editado")).toBe(
      false,
    );
  });
});

describe("buildReplanAfterRemoveWaypoint", () => {
  it("returns remaining pending stops without the removed waypoint", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala",
      city: "Apodaca",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      city: "CDMX",
    });

    const result = buildReplanAfterRemoveWaypoint(
      [origin, waypoint, dest],
      "stop-wp",
    );

    expect(result.map((stop) => stop.id)).toEqual(["stop-dest"]);
  });

  it("excludes immutable stops from the remove payload", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
    });

    const result = buildReplanAfterRemoveWaypoint(
      [origin, waypoint, dest],
      "stop-wp",
    );

    expect(result.every((stop) => stop.id !== "stop-origin")).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("recalculates destination distance against origin after removing waypoint", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
      latitude: santaFe.latitude,
      longitude: santaFe.longitude,
      distanceFromPreviousKm: null,
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala",
      city: "El Marques",
      latitude: elMarques.latitude,
      longitude: elMarques.longitude,
      distanceFromPreviousKm: originToWaypointKm,
      distanceSource: "haversine_fallback",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      city: "Zayulita",
      latitude: zayulita.latitude,
      longitude: zayulita.longitude,
      // Stale: still B→C after remove should become A→C
      distanceFromPreviousKm: waypointToDestKm,
      distanceSource: "haversine_fallback",
    });

    const result = buildReplanAfterRemoveWaypoint(
      [origin, waypoint, dest],
      "stop-wp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stop-dest");
    expect(result[0]?.distanceFromPreviousKm).toBe(originToDestKm);
    expect(result[0]?.distanceSource).toBe("haversine_fallback");
  });

  it("preserves manual distanceSource on remaining stop after remove", () => {
    const origin = makeStop({
      id: "stop-origin",
      status: StopStatus.COMPLETED,
      actualDeparture: "2026-05-01T10:00:00.000Z",
      latitude: santaFe.latitude,
      longitude: santaFe.longitude,
    });
    const waypoint = makeStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala",
      latitude: elMarques.latitude,
      longitude: elMarques.longitude,
      distanceFromPreviousKm: originToWaypointKm,
      distanceSource: "haversine_fallback",
    });
    const dest = makeStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "Destino",
      latitude: zayulita.latitude,
      longitude: zayulita.longitude,
      distanceFromPreviousKm: 999,
      distanceSource: "manual",
    });

    const result = buildReplanAfterRemoveWaypoint(
      [origin, waypoint, dest],
      "stop-wp",
    );

    expect(result[0]?.distanceFromPreviousKm).toBe(999);
    expect(result[0]?.distanceSource).toBe("manual");
  });
});

describe("buildReplanAfterReorderWaypoint", () => {
  const origin = makeStop({
    id: "stop-origin",
    status: StopStatus.COMPLETED,
    actualDeparture: "2026-05-01T10:00:00.000Z",
    latitude: santaFe.latitude,
    longitude: santaFe.longitude,
  });
  const wp1 = makeStop({
    id: "stop-wp-1",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT, StopType.PICKUP],
    locationName: "Escala A",
    city: "Apodaca",
    latitude: elMarques.latitude,
    longitude: elMarques.longitude,
    distanceFromPreviousKm: originToWaypointKm,
    distanceSource: "haversine_fallback",
  });
  const wp2 = makeStop({
    id: "stop-wp-2",
    sequenceOrder: 3,
    stopType: [StopType.WAYPOINT, StopType.DELIVERY],
    locationName: "Escala B",
    city: "Santa Catarina",
    latitude: zayulita.latitude,
    longitude: zayulita.longitude,
    distanceFromPreviousKm: waypointToDestKm,
    distanceSource: "haversine_fallback",
  });
  const dest = makeStop({
    id: "stop-dest",
    sequenceOrder: 4,
    stopType: [StopType.DESTINATION, StopType.DELIVERY],
    locationName: "Destino",
    city: "CDMX",
    latitude: 19.43,
    longitude: -99.13,
    distanceFromPreviousKm: 50,
    distanceSource: "haversine_fallback",
  });
  const ordered = [origin, wp1, wp2, dest];

  it("swaps waypoints down and keeps destination id", () => {
    const result = buildReplanAfterReorderWaypoint(ordered, "stop-wp-1", "down");
    expect(result).not.toBeNull();
    expect(result!.map((stop) => stop.id)).toEqual([
      "stop-wp-2",
      "stop-wp-1",
      "stop-dest",
    ]);
  });

  it("swaps waypoints up", () => {
    const result = buildReplanAfterReorderWaypoint(ordered, "stop-wp-2", "up");
    expect(result).not.toBeNull();
    expect(result!.map((stop) => stop.id)).toEqual([
      "stop-wp-2",
      "stop-wp-1",
      "stop-dest",
    ]);
  });

  it("returns null at first waypoint up and last waypoint down", () => {
    expect(buildReplanAfterReorderWaypoint(ordered, "stop-wp-1", "up")).toBeNull();
    expect(
      buildReplanAfterReorderWaypoint(ordered, "stop-wp-2", "down"),
    ).toBeNull();
  });

  it("excludes immutable stops from reorder payload", () => {
    const result = buildReplanAfterReorderWaypoint(ordered, "stop-wp-1", "down");
    expect(result!.some((stop) => stop.id === "stop-origin")).toBe(false);
  });

  it("recalculates segment distances after swapping waypoints", () => {
    const result = buildReplanAfterReorderWaypoint(ordered, "stop-wp-1", "down");
    expect(result).not.toBeNull();

    // Order after swap: origin → wp2 → wp1 → dest
    const nextWp2 = result!.find((stop) => stop.id === "stop-wp-2");
    const nextWp1 = result!.find((stop) => stop.id === "stop-wp-1");
    const nextDest = result!.find((stop) => stop.id === "stop-dest");

    expect(nextWp2?.distanceFromPreviousKm).toBe(
      estimateRoadDistanceKm(
        santaFe.latitude,
        santaFe.longitude,
        zayulita.latitude,
        zayulita.longitude,
      ),
    );
    expect(nextWp1?.distanceFromPreviousKm).toBe(
      estimateRoadDistanceKm(
        zayulita.latitude,
        zayulita.longitude,
        elMarques.latitude,
        elMarques.longitude,
      ),
    );
    expect(nextDest?.distanceFromPreviousKm).toBe(
      estimateRoadDistanceKm(
        elMarques.latitude,
        elMarques.longitude,
        19.43,
        -99.13,
      ),
    );
    expect(nextWp2?.distanceSource).toBe("haversine_fallback");
  });
});
