import { describe, expect, it } from "vitest";

import { StopType, TripStatus, type TripStop } from "@features/trips/domain";

import {
  countOperativelyCompleteStops,
  countStopsMissingFiscalRfc,
  countStopsMissingSegmentDistance,
  formatDistanceSourceLabel,
  formatStopTimeForDisplay,
  getRouteStopCategory,
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  getStopTimeDisplayRows,
  getStopTimeFieldsVisibility,
  groupStopsForRouteDetail,
  hasStopType,
  isStopOperativelyComplete,
  shouldShowTrackingHint,
  stopRequiresFiscalRfc,
  stopUsesSavedAddress,
  sumRouteSegmentDistanceKm,
} from "./tripRouteDetailHelpers";
import { routeCopy } from "../../copy/tripDetail/routeCopy";

function stop(overrides: Partial<TripStop>): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
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
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
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

describe("tripRouteDetailHelpers", () => {
  it("categorizes stops by route role", () => {
    expect(
      getRouteStopCategory(stop({ stopType: [StopType.ORIGIN, StopType.PICKUP] })),
    ).toBe("origin");
    expect(
      getRouteStopCategory(
        stop({ stopType: [StopType.DESTINATION, StopType.DELIVERY] }),
      ),
    ).toBe("destination");
    expect(getRouteStopCategory(stop({ stopType: [StopType.WAYPOINT] }))).toBe(
      "waypoint",
    );
  });

  it("groups route stops preserving sequence order", () => {
    const stops = [
      stop({ id: "s2", sequenceOrder: 2, stopType: [StopType.WAYPOINT] }),
      stop({ id: "s3", sequenceOrder: 3, stopType: [StopType.DESTINATION] }),
      stop({ id: "s1", sequenceOrder: 1, stopType: [StopType.ORIGIN] }),
    ];

    const grouped = groupStopsForRouteDetail(stops);

    expect(grouped.ordered.map((item) => item.id)).toEqual(["s1", "s2", "s3"]);
    expect(grouped.origin?.id).toBe("s1");
    expect(grouped.destination?.id).toBe("s3");
    expect(grouped.waypoints.map((item) => item.id)).toEqual(["s2"]);
  });

  it("sums only positive segment distances after first stop", () => {
    const total = sumRouteSegmentDistanceKm([
      stop({ id: "s1", sequenceOrder: 1, distanceFromPreviousKm: 25 }),
      stop({ id: "s2", sequenceOrder: 2, distanceFromPreviousKm: 100.5 }),
      stop({ id: "s3", sequenceOrder: 3, distanceFromPreviousKm: 0 }),
      stop({ id: "s4", sequenceOrder: 4, distanceFromPreviousKm: null }),
      stop({ id: "s5", sequenceOrder: 5, distanceFromPreviousKm: 80 }),
    ]);

    expect(total).toBe(180.5);
  });

  it("counts stops missing segment distance", () => {
    const missing = countStopsMissingSegmentDistance([
      stop({ id: "s1", sequenceOrder: 1, distanceFromPreviousKm: null }),
      stop({ id: "s2", sequenceOrder: 2, distanceFromPreviousKm: null }),
      stop({ id: "s3", sequenceOrder: 3, distanceFromPreviousKm: 0 }),
      stop({ id: "s4", sequenceOrder: 4, distanceFromPreviousKm: 50 }),
    ]);

    expect(missing).toBe(2);
  });

  it("requires fiscal RFC only for fiscal-relevant stop types", () => {
    expect(stopRequiresFiscalRfc(stop({ stopType: [StopType.ORIGIN] }))).toBe(true);
    expect(stopRequiresFiscalRfc(stop({ stopType: [StopType.PICKUP] }))).toBe(true);
    expect(stopRequiresFiscalRfc(stop({ stopType: [StopType.WAYPOINT] }))).toBe(false);
  });

  it("counts missing RFC only for fiscal-relevant stops", () => {
    const missing = countStopsMissingFiscalRfc([
      stop({ id: "s1", stopType: [StopType.ORIGIN], rfcRemitenteDestinatario: "" }),
      stop({
        id: "s2",
        stopType: [StopType.DESTINATION],
        rfcRemitenteDestinatario: "AAA010101AAA",
      }),
      stop({ id: "s3", stopType: [StopType.WAYPOINT], rfcRemitenteDestinatario: "" }),
      stop({ id: "s4", stopType: [StopType.PICKUP], rfcRemitenteDestinatario: null }),
    ]);

    expect(missing).toBe(2);
  });

  it("maps distance source labels for UI", () => {
    expect(formatDistanceSourceLabel("manual")).toBe(routeCopy.label.distanceManual);
    expect(formatDistanceSourceLabel("mapbox_matrix")).toBe(routeCopy.label.distanceMapbox);
    expect(formatDistanceSourceLabel("haversine_fallback")).toBe(
      routeCopy.label.distanceEstimated,
    );
    expect(formatDistanceSourceLabel(null)).toBeNull();
  });

  it("shows tracking hint only for in-progress and pending stops", () => {
    expect(shouldShowTrackingHint(TripStatus.IN_PROGRESS, false)).toBe(true);
    expect(shouldShowTrackingHint(TripStatus.IN_PROGRESS, true)).toBe(false);
    expect(shouldShowTrackingHint(TripStatus.SCHEDULED, false)).toBe(false);
  });

  it("formats stop times with date and hour in Mexico locale", () => {
    const formatted = formatStopTimeForDisplay(new Date("2026-05-28T20:57:00.000Z"));
    expect(formatted).not.toBe("—");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/may/i);
  });

  it("exposes time field visibility by route category", () => {
    expect(getStopTimeFieldsVisibility("origin")).toEqual({
      showArrival: false,
      showDeparture: true,
    });
    expect(getStopTimeFieldsVisibility("destination")).toEqual({
      showArrival: true,
      showDeparture: false,
    });
    expect(getStopTimeFieldsVisibility("waypoint")).toEqual({
      showArrival: true,
      showDeparture: true,
    });
  });

  it("builds time rows aligned to stop role", () => {
    const tripTimes = {
      scheduledDeparture: new Date("2026-05-28T14:00:00.000Z"),
      actualDeparture: null,
    };
    const origin = stop({ stopType: [StopType.ORIGIN] });
    const originRows = getStopTimeDisplayRows(origin, "origin", tripTimes);
    expect(originRows).toHaveLength(1);
    expect(originRows[0]?.kind).toBe("departure");
    expect(originRows[0]?.label).toContain("viaje");

    const destination = stop({
      stopType: [StopType.DESTINATION],
      estimatedArrival: new Date("2026-05-28T20:00:00.000Z"),
    });
    const destRows = getStopTimeDisplayRows(destination, "destination");
    expect(destRows).toHaveLength(1);
    expect(destRows[0]?.kind).toBe("arrival");

    const waypoint = stop({
      stopType: [StopType.WAYPOINT],
      actualArrival: new Date("2026-05-28T16:00:00.000Z"),
    });
    const wpRows = getStopTimeDisplayRows(waypoint, "waypoint");
    expect(wpRows).toHaveLength(2);
  });

  it("derives visit state for progress and badges", () => {
    const tripTimes = { actualDeparture: new Date("2026-05-28T14:00:00.000Z") };
    const origin = stop({ stopType: [StopType.ORIGIN] });
    expect(getStopOperationalVisitState(origin, "origin", tripTimes)).toBe("visited");
    expect(isStopOperativelyComplete(origin, "origin", tripTimes)).toBe(true);

    const escala = stop({
      stopType: [StopType.WAYPOINT],
      actualArrival: new Date("2026-05-28T16:00:00.000Z"),
    });
    expect(getStopOperationalVisitState(escala, "waypoint")).toBe("at_stop");
    expect(getStopOperationalVisitLabel("at_stop")).toBe(routeCopy.label.visitAtStop);

    const completed = [
      stop({
        id: "o",
        stopType: [StopType.ORIGIN],
        actualDeparture: new Date("2026-05-28T10:00:00.000Z"),
      }),
      stop({
        id: "d",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        actualArrival: new Date("2026-05-28T18:00:00.000Z"),
      }),
    ];
    expect(countOperativelyCompleteStops(completed)).toBe(2);
  });

  it("detects saved-address IDs and stop type helper", () => {
    expect(
      stopUsesSavedAddress(
        stop({ addressId: "a12f47d0-5f4e-4f1a-8f7d-0123456789ab" }),
      ),
    ).toBe(true);
    expect(stopUsesSavedAddress(stop({ addressId: "legacy-address-id" }))).toBe(false);
    expect(hasStopType([StopType.ORIGIN, StopType.PICKUP], StopType.PICKUP)).toBe(
      true,
    );
  });
});
