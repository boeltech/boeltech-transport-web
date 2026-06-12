import { describe, expect, it } from "vitest";
import { StopType, type TripStop } from "@features/trips/domain";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  isTrackingEscalaStop,
} from "./trackingStopEligibility";

function stop(
  partial: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">,
): TripStop {
  return {
    tenantId: "t1",
    tripId: "trip1",
    addressId: null,
    clientId: null,
    clientAddressId: null,
    address: "",
    city: "",
    state: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    locationName: null,
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    estimatedDeparture: null,
    notes: null,
    idUbicacion: null,
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: null,
    satEstadoCode: null,
    satLocalidadCode: null,
    satMunicipioCode: null,
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
    status: "pending",
    actualArrival: null,
    actualDeparture: null,
    ...partial,
  } as TripStop;
}

describe("isTrackingEscalaStop", () => {
  it("acepta waypoint puro", () => {
    expect(
      isTrackingEscalaStop(
        stop({ id: "1", sequenceOrder: 1, stopType: [StopType.WAYPOINT] }),
      ),
    ).toBe(true);
  });

  it("rechaza origen y destino", () => {
    expect(
      isTrackingEscalaStop(
        stop({ id: "1", sequenceOrder: 0, stopType: [StopType.ORIGIN] }),
      ),
    ).toBe(false);
    expect(
      isTrackingEscalaStop(
        stop({ id: "2", sequenceOrder: 2, stopType: [StopType.DESTINATION] }),
      ),
    ).toBe(false);
  });
});

describe("findNextStopForArrival", () => {
  it("omite origen aunque no tenga llegada", () => {
    const stops = [
      stop({
        id: "origin",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        actualDeparture: new Date(),
        status: "completed",
      }),
      stop({
        id: "scale",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
      }),
    ];
    expect(findNextStopForArrival(stops)?.id).toBe("scale");
  });

  it("ofrece destino cuando no hay escalas pendientes", () => {
    const stops = [
      stop({
        id: "origin",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        actualDeparture: new Date(),
        status: "completed",
      }),
      stop({
        id: "dest",
        sequenceOrder: 1,
        stopType: [StopType.DESTINATION],
      }),
    ];
    expect(findNextStopForArrival(stops)?.id).toBe("dest");
  });

  it("prioriza escala antes que destino", () => {
    const stops = [
      stop({
        id: "scale",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
      }),
      stop({
        id: "dest",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
      }),
    ];
    expect(findNextStopForArrival(stops)?.id).toBe("scale");
  });
});

describe("findActiveEscalaForDeparture", () => {
  it("omite destino aunque tenga llegada sin salida", () => {
    const stops = [
      stop({
        id: "dest",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        actualArrival: new Date(),
        status: "in_progress",
      }),
      stop({
        id: "scale",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        actualArrival: new Date(),
        status: "in_progress",
      }),
    ];
    expect(findActiveEscalaForDeparture(stops)?.id).toBe("scale");
  });
});

describe("findDestinationAwaitingTripArrival", () => {
  it("detecta destino con llegada y status in_progress", () => {
    const stops = [
      stop({
        id: "origin",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        status: "completed",
        actualDeparture: new Date(),
      }),
      stop({
        id: "dest",
        sequenceOrder: 1,
        stopType: [StopType.DESTINATION],
        status: "in_progress",
        actualArrival: new Date(),
      }),
    ];
    expect(findDestinationAwaitingTripArrival(stops)?.id).toBe("dest");
  });

  it("no aplica si aun hay escala sin salir", () => {
    const stops = [
      stop({
        id: "scale",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        status: "in_progress",
        actualArrival: new Date(),
      }),
      stop({
        id: "dest",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        status: "in_progress",
        actualArrival: new Date(),
      }),
    ];
    expect(findDestinationAwaitingTripArrival(stops)).toBeUndefined();
  });

  it("no aplica si el destino aun no tiene llegada", () => {
    const stops = [
      stop({
        id: "dest",
        sequenceOrder: 1,
        stopType: [StopType.DESTINATION],
        status: "pending",
      }),
    ];
    expect(findDestinationAwaitingTripArrival(stops)).toBeUndefined();
  });

  it("detecta cierre cuando destino ya esta completed pero el viaje sigue abierto", () => {
    const stops = [
      stop({
        id: "origin",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        status: "completed",
        actualArrival: new Date(),
        actualDeparture: new Date(),
      }),
      stop({
        id: "scale",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        status: "completed",
        actualArrival: new Date(),
        actualDeparture: new Date(),
      }),
      stop({
        id: "dest",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        status: "completed",
        actualArrival: new Date(),
      }),
    ];
    expect(findDestinationAwaitingTripArrival(stops)?.id).toBe("dest");
  });
});
