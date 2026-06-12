import { describe, expect, it } from "vitest";
import type { TripCargo, TripStop } from "@features/trips/domain";
import { CargoStatus, StopType } from "@features/trips/domain";
import { getStopCargoLinks, resolveStopForMovement } from "./stopCargoCorrelation";
import {
  canPerformCargoAction,
  getCargoManualActions,
} from "./cargoStatusActions";

const stop = {
  id: "stop-1",
  tenantId: "t1",
  tripId: "trip-1",
  sequenceOrder: 2,
  stopType: ["pickup"],
  addressId: "addr-1",
  address: "Calle 1",
  city: "Monterrey",
  state: "NL",
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: "Bodega",
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending",
  distanceFromPreviousKm: null,
  distanceSource: null,
  distanceProvider: null,
  distanceConfidence: null,
  distanceComputedAt: null,
  rfcRemitenteDestinatario: null,
  nombreRemitenteDestinatario: null,
  cargoActionDescription: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as TripStop;

function makeCargo(overrides: Partial<TripCargo> = {}): TripCargo {
  return {
    id: "cargo-1",
    tenantId: "t1",
    tripId: "trip-1",
    clientId: "c1",
    description: "Caja",
    productType: null,
    weight: 10,
    volume: null,
    units: 1,
    declaredValue: null,
    aseguraCarga: null,
    polizaCarga: null,
    rate: 0,
    currency: "MXN",
    movements: [
      {
        id: "mov-1",
        cargoId: "cargo-1",
        stopId: "stop-1",
        stopIndex: 2,
        movementType: "pickup",
        weight: 10,
        units: 1,
        completedAt: null,
        notes: null,
      },
    ],
    status: CargoStatus.PENDING,
    pickedUpAt: null,
    deliveredAt: null,
    notes: null,
    specialInstructions: null,
    satProductCode: null,
    satProductDescription: null,
    satUnitCode: null,
    satUnitName: null,
    weightInKg: 10,
    dimensions: null,
    hazardousMaterial: null,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    sectorRequirements: null,
    sectorCofepris: null,
    nombreIngredienteActivo: null,
    nomQuimico: null,
    denominacionGenericaProd: null,
    denominacionDistintivaProd: null,
    fabricante: null,
    fechaCaducidad: null,
    loteMedicamento: null,
    formaFarmaceutica: null,
    condicionesEspTransp: null,
    registroSanitarioFolioAutorizacion: null,
    permisoImportacion: null,
    folioImpoVucem: null,
    numCas: null,
    razonSocialEmpImp: null,
    numRegSanPlagCofepris: null,
    datosFabricante: null,
    datosFormulador: null,
    datosMaquilador: null,
    usoAutorizado: null,
    fraccionArancelaria: null,
    uuidComercioExterior: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("stopCargoCorrelation", () => {
  it("links cargos to stop by movement stopId", () => {
    const links = getStopCargoLinks(stop, [makeCargo()], [stop]);
    expect(links).toHaveLength(1);
    expect(links[0]?.movementType).toBe("pickup");
    expect(links[0]?.cargo.description).toBe("Caja");
  });

  it("links delivery by array stopIndex when sequenceOrder is 1-based", () => {
    const origin = { ...stop, id: "stop-origin", sequenceOrder: 1 } as TripStop;
    const destination = {
      ...stop,
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION],
    } as TripStop;
    const route = [
      origin,
      { ...stop, id: "stop-mid", sequenceOrder: 2 },
      destination,
    ] as TripStop[];
    const cargo = makeCargo({
      movements: [
        {
          id: "m-pickup",
          movementType: "pickup",
          stopId: "stop-origin",
          stopIndex: 0,
          completedAt: null,
          weight: null,
          units: null,
          notes: null,
        },
        {
          id: "m-delivery",
          movementType: "delivery",
          stopId: undefined,
          stopIndex: 2,
          completedAt: null,
          weight: null,
          units: null,
          notes: null,
        },
      ],
      status: CargoStatus.IN_TRANSIT,
    });

    const deliveryLinks = getStopCargoLinks(destination, [cargo], route);
    expect(deliveryLinks).toHaveLength(1);
    expect(deliveryLinks[0]?.movementType).toBe("delivery");
    expect(resolveStopForMovement(cargo.movements[1]!, route)?.id).toBe(
      "stop-dest",
    );
  });

  it("links in_transit cargo at destination without delivery movement", () => {
    const origin = {
      ...stop,
      id: "stop-origin",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN, StopType.PICKUP],
    } as TripStop;
    const destination = {
      ...stop,
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
    } as TripStop;
    const route = [
      origin,
      { ...stop, id: "stop-mid", sequenceOrder: 2, stopType: [StopType.WAYPOINT] },
      destination,
    ] as TripStop[];

    const cargo = makeCargo({
      status: CargoStatus.IN_TRANSIT,
      pickedUpAt: new Date("2026-01-01T10:00:00Z"),
      movements: [
        {
          id: "m-pickup",
          movementType: "pickup",
          stopId: "stop-origin",
          stopIndex: 0,
          completedAt: new Date("2026-01-01T10:00:00Z"),
          weight: null,
          units: null,
          notes: null,
        },
      ],
    });

    const links = getStopCargoLinks(destination, [cargo], route);
    expect(links).toHaveLength(1);
    expect(links[0]?.movementType).toBe("delivery");
    expect(links[0]?.cargo.id).toBe(cargo.id);
  });

  it("does not show pickup cargo at destination when still pending", () => {
    const destination = {
      ...stop,
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
    } as TripStop;
    const route = [
      { ...stop, id: "stop-origin", sequenceOrder: 1, stopType: [StopType.ORIGIN] },
      destination,
    ] as TripStop[];

    const cargo = makeCargo({
      status: CargoStatus.PENDING,
      movements: [
        {
          id: "m-pickup",
          movementType: "pickup",
          stopId: "stop-origin",
          stopIndex: 0,
          completedAt: null,
          weight: null,
          units: null,
          notes: null,
        },
      ],
    });

    expect(getStopCargoLinks(destination, [cargo], route)).toHaveLength(0);
  });
});

describe("cargoStatusActions", () => {
  it("offers pickup and deliver for pending when trip in progress", () => {
    expect(getCargoManualActions(CargoStatus.PENDING, true)).toEqual([
      "pickup",
      "deliver",
      "return",
      "cancel",
    ]);
  });

  it("blocks actions when trip not in progress", () => {
    expect(getCargoManualActions(CargoStatus.PENDING, false)).toEqual([]);
  });

  it("canPerformCargoAction respects matrix", () => {
    expect(canPerformCargoAction(CargoStatus.PENDING, "pickup")).toBe(true);
    expect(canPerformCargoAction(CargoStatus.DELIVERED, "pickup")).toBe(false);
  });
});
