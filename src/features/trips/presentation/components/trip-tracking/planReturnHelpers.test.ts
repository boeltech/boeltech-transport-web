import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopStatus,
  StopType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import {
  buildPlanReturnPendingStops,
  destinationFromPickupStop,
  hasMultiUnloadActiveCargoWithoutDelivery,
  listPendingDeliveriesForOtherCargos,
  resolveCargoPickupStop,
  resolvePlanReturnTargetCargo,
  resolveReturnedCargoBadge,
  resolveReturnStopForCargo,
  tripHasInferredReturnStop,
} from "./planReturnHelpers";

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
    city: "Monterrey",
    state: "NL",
    postalCode: "64000",
    latitude: 25.67,
    longitude: -100.31,
    locationName: "CEDIS Monterrey",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: StopStatus.PENDING,
    notes: null,
    idUbicacion: null,
    street: "Calle 1",
    exteriorNumber: "100",
    interiorNumber: null,
    colonia: "Centro",
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: "NLE",
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

function makeCargo(overrides: Partial<TripCargo> = {}): TripCargo {
  return {
    id: "cargo-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    clientId: "client-1",
    description: "Bebidas embotelladas",
    productType: null,
    weight: 100,
    volume: null,
    units: 8,
    declaredValue: null,
    aseguraCarga: null,
    polizaCarga: null,
    rate: 0,
    currency: "MXN",
    movements: [
      {
        stopIndex: 0,
        movementType: "pickup",
        weight: 100,
        units: 8,
        completedAt: null,
        notes: null,
        stopId: "origin",
      },
      {
        stopIndex: 1,
        movementType: "delivery",
        weight: 100,
        units: 8,
        completedAt: null,
        notes: null,
        stopId: "saltillo",
      },
    ],
    status: CargoStatus.RETURNED,
    pickedUpAt: null,
    deliveredAt: null,
    notes: null,
    specialInstructions: null,
    satProductCode: null,
    satProductDescription: null,
    satUnitCode: null,
    satUnitName: null,
    weightInKg: 6200,
    dimensions: null,
    hazardousMaterial: null,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    sectorRequirements: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides,
  } as TripCargo;
}

describe("planReturnHelpers", () => {
  const origin = makeStop({
    id: "origin",
    sequenceOrder: 1,
    status: StopStatus.COMPLETED,
    actualArrival: new Date("2026-01-01T08:00:00Z"),
    actualDeparture: new Date("2026-01-01T09:00:00Z"),
    sourceAddressId: "addr-mty",
  });
  const saltillo = makeStop({
    id: "saltillo",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT, StopType.DELIVERY],
    status: StopStatus.IN_PROGRESS,
    actualArrival: new Date("2026-01-01T11:00:00Z"),
    locationName: "Bodega Saltillo",
    city: "Saltillo",
    latitude: 25.42,
    longitude: -100.99,
    sourceAddressId: "addr-sal",
  });
  const torreon = makeStop({
    id: "torreon",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION, StopType.DELIVERY],
    status: StopStatus.PENDING,
    locationName: "CEDIS Torreón",
    city: "Torreón",
    latitude: 25.54,
    longitude: -103.4,
    sourceAddressId: "addr-tor",
    distanceFromPreviousKm: 200,
  });

  const returnedCargo = makeCargo({ id: "cargo-bebidas" });
  const pendingCargo = makeCargo({
    id: "cargo-abarrotes",
    status: CargoStatus.IN_TRANSIT,
    description: "Abarrotes secos",
    movements: [
      {
        stopIndex: 0,
        movementType: "pickup",
        weight: 50,
        units: 4,
        completedAt: null,
        notes: null,
        stopId: "origin",
      },
      {
        stopIndex: 2,
        movementType: "delivery",
        weight: 50,
        units: 4,
        completedAt: null,
        notes: null,
        stopId: "torreon",
      },
    ],
  });

  it("resolvePlanReturnTargetCargo picks returned cargo", () => {
    expect(
      resolvePlanReturnTargetCargo([pendingCargo, returnedCargo])?.id,
    ).toBe("cargo-bebidas");
  });

  it("resolveCargoPickupStop uses pickup movement", () => {
    const stop = resolveCargoPickupStop(returnedCargo, [
      origin,
      saltillo,
      torreon,
    ]);
    expect(stop?.id).toBe("origin");
  });

  it("listPendingDeliveriesForOtherCargos ignores returned cargo", () => {
    const pending = listPendingDeliveriesForOtherCargos(
      [returnedCargo, pendingCargo],
      [origin, saltillo, torreon],
      returnedCargo.id,
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]?.stop.id).toBe("torreon");
  });

  it("detects multi-unload gap when active cargo lacks delivery (F5d-c)", () => {
    const gapCargo = makeCargo({
      id: "cargo-gap",
      status: CargoStatus.PENDING,
      movements: [
        {
          stopIndex: 0,
          movementType: "pickup",
          weight: null,
          units: null,
          completedAt: null,
          notes: null,
          stopId: "origin",
        },
      ],
    });
    expect(
      hasMultiUnloadActiveCargoWithoutDelivery(
        [returnedCargo, gapCargo],
        [origin, saltillo, torreon],
      ),
    ).toBe(true);
    expect(
      hasMultiUnloadActiveCargoWithoutDelivery(
        [returnedCargo, pendingCargo],
        [origin, saltillo, torreon],
      ),
    ).toBe(false);
  });

  it("badge ámbar mientras return_replan_required", () => {
    const badge = resolveReturnedCargoBadge({
      cargo: returnedCargo,
      returnReplanRequired: true,
      orderedStops: [origin, saltillo, torreon],
    });
    expect(badge?.variant).toBe("warning");
    expect(badge?.label).toMatch(/a bordo/i);
  });

  it("buildPlanReturnPendingStops at_end demotes destination and inserts return", () => {
    const dest = destinationFromPickupStop(origin);
    const pending = buildPlanReturnPendingStops({
      orderedStops: [origin, saltillo, torreon],
      returnDestination: dest,
      timing: "at_end",
      hasPendingDeliveries: true,
    });
    const insert = pending.find((p) => !p.id);
    expect(insert).toBeDefined();
    expect(insert?.stopType).toEqual(
      expect.arrayContaining(["destination"]),
    );
    const torreonMod = pending.find((p) => p.id === "torreon");
    expect(torreonMod?.stopType).toEqual(
      expect.arrayContaining(["waypoint"]),
    );
    expect(torreonMod?.stopType).not.toEqual(
      expect.arrayContaining(["destination"]),
    );
  });

  it("buildPlanReturnPendingStops before_next inserts return first among pending", () => {
    const dest = destinationFromPickupStop(origin);
    const pending = buildPlanReturnPendingStops({
      orderedStops: [origin, saltillo, torreon],
      returnDestination: dest,
      timing: "before_next",
      hasPendingDeliveries: true,
    });
    const insertIdx = pending.findIndex((p) => !p.id);
    expect(insertIdx).toBe(0);
    expect(pending[0]?.stopType).toEqual(
      expect.arrayContaining(["waypoint"]),
    );
    expect(pending.some((p) => p.id === "torreon")).toBe(true);
  });

  it("R7 inferencia: pending que coincide con pickup → return stop", () => {
    const returnStop = makeStop({
      id: "return-mty",
      sequenceOrder: 4,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      status: StopStatus.PENDING,
      locationName: "CEDIS Monterrey",
      city: "Monterrey",
      sourceAddressId: "addr-mty",
      latitude: 25.67,
      longitude: -100.31,
    });
    const found = resolveReturnStopForCargo(returnedCargo, [
      origin,
      saltillo,
      torreon,
      returnStop,
    ]);
    expect(found?.id).toBe("return-mty");
    expect(
      tripHasInferredReturnStop(
        [returnedCargo],
        [origin, saltillo, torreon, returnStop],
      ),
    ).toBe(true);
  });

  it("F4c: R7 inferencia también con return stop in_progress (at_stop)", () => {
    const returnStop = makeStop({
      id: "return-mty",
      sequenceOrder: 4,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      status: StopStatus.IN_PROGRESS,
      actualArrival: new Date("2026-01-01T16:00:00Z"),
      locationName: "CEDIS Monterrey",
      city: "Monterrey",
      sourceAddressId: "addr-mty",
      latitude: 25.67,
      longitude: -100.31,
    });
    const found = resolveReturnStopForCargo(returnedCargo, [
      origin,
      saltillo,
      torreon,
      returnStop,
    ]);
    expect(found?.id).toBe("return-mty");
  });
});
