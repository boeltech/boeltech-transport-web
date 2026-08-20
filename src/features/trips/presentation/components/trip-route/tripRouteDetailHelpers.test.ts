import { describe, expect, it } from "vitest";

import { StopStatus, StopType, TripStatus, type TripStop } from "@features/trips/domain";

import { progressCopy } from "../../copy/tripDetail/progressCopy";

import {
  countOperativelyCompleteStops,
  countFillableMissingSegmentDistances,
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
  isStopDomicilioComplete,
  isStopOperativelyComplete,
  buildRouteMasterRows,
  resolveRouteMasterRowId,
  ROUTE_SLOT_DESTINATION_ID,
  ROUTE_SLOT_ORIGIN_ID,
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
      stop({ id: "s1", sequenceOrder: 1, stopType: [StopType.WAYPOINT] }),
      stop({ id: "s2", sequenceOrder: 2, stopType: [StopType.DESTINATION] }),
      stop({ id: "s0", sequenceOrder: 0, stopType: [StopType.ORIGIN] }),
    ];

    const grouped = groupStopsForRouteDetail(stops);

    expect(grouped.ordered.map((item) => item.id)).toEqual(["s0", "s1", "s2"]);
    expect(grouped.origin?.id).toBe("s0");
    expect(grouped.destination?.id).toBe("s2");
    expect(grouped.waypoints.map((item) => item.id)).toEqual(["s1"]);
  });

  it("sums only positive segment distances after first stop", () => {
    const total = sumRouteSegmentDistanceKm([
      stop({ id: "s0", sequenceOrder: 0, distanceFromPreviousKm: 25 }),
      stop({ id: "s1", sequenceOrder: 1, distanceFromPreviousKm: 100.5 }),
      stop({ id: "s2", sequenceOrder: 2, distanceFromPreviousKm: 0 }),
      stop({ id: "s3", sequenceOrder: 3, distanceFromPreviousKm: null }),
      stop({ id: "s4", sequenceOrder: 4, distanceFromPreviousKm: 80 }),
    ]);

    expect(total).toBe(180.5);
  });

  it("includes waypoint at sequenceOrder 1 in segment distance totals", () => {
    const total = sumRouteSegmentDistanceKm([
      stop({ id: "s0", sequenceOrder: 0, stopType: [StopType.ORIGIN] }),
      stop({
        id: "s1",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        distanceFromPreviousKm: 120.25,
      }),
      stop({
        id: "s2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        distanceFromPreviousKm: 662.79,
      }),
    ]);

    expect(total).toBeCloseTo(783.04);
  });

  it("counts stops missing segment distance", () => {
    const missing = countStopsMissingSegmentDistance([
      stop({ id: "s0", sequenceOrder: 0, distanceFromPreviousKm: null }),
      stop({ id: "s1", sequenceOrder: 1, distanceFromPreviousKm: null }),
      stop({ id: "s2", sequenceOrder: 2, distanceFromPreviousKm: 0 }),
      stop({ id: "s3", sequenceOrder: 3, distanceFromPreviousKm: 50 }),
    ]);

    expect(missing).toBe(2);
  });

  it("counts waypoint at sequenceOrder 1 when distance is missing", () => {
    const missing = countStopsMissingSegmentDistance([
      stop({ id: "s0", sequenceOrder: 0, stopType: [StopType.ORIGIN] }),
      stop({
        id: "s1",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        distanceFromPreviousKm: null,
      }),
      stop({
        id: "s2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        distanceFromPreviousKm: 662.79,
      }),
    ]);

    expect(missing).toBe(1);
  });

  it("does not treat 1-based origin as a missing segment", () => {
    const origin = stop({
      id: "s-origin",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN, StopType.PICKUP],
      distanceFromPreviousKm: null,
    });
    const destination = stop({
      id: "s-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      distanceFromPreviousKm: null,
    });

    expect(countStopsMissingSegmentDistance([origin, destination])).toBe(1);
    expect(countFillableMissingSegmentDistances([origin, destination])).toBe(0);
    expect(sumRouteSegmentDistanceKm([origin, destination])).toBeNull();
    expect(
      sumRouteSegmentDistanceKm([
        origin,
        { ...destination, distanceFromPreviousKm: 420.5 },
      ]),
    ).toBe(420.5);
  });

  it("counts fillable missing segments only when consecutive stops have coordinates", () => {
    const origin = stop({
      id: "s-origin",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN],
      latitude: 19.357,
      longitude: -99.259,
      distanceFromPreviousKm: null,
    });
    const destination = stop({
      id: "s-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION],
      latitude: 20.784,
      longitude: -105.518,
      distanceFromPreviousKm: null,
    });

    expect(countFillableMissingSegmentDistances([origin, destination])).toBe(1);
    expect(
      countFillableMissingSegmentDistances([
        origin,
        { ...destination, latitude: null, longitude: null },
      ]),
    ).toBe(0);
    expect(
      countFillableMissingSegmentDistances([
        origin,
        { ...destination, distanceFromPreviousKm: 420.5 },
      ]),
    ).toBe(0);
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
    expect(formatDistanceSourceLabel("mapbox_matrix")).toBe(routeCopy.label.distanceMap);
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
    expect(originRows[0]?.label).toBe(routeCopy.label.scheduledDepartureTrip);

    const destination = stop({
      stopType: [StopType.DESTINATION],
      estimatedArrival: new Date("2026-05-28T20:00:00.000Z"),
    });
    const destRows = getStopTimeDisplayRows(destination, "destination");
    expect(destRows).toHaveLength(1);
    expect(destRows[0]?.kind).toBe("arrival");
    expect(destRows[0]?.label).toBe(routeCopy.label.estimatedArrivalDestination);

    const waypoint = stop({
      stopType: [StopType.WAYPOINT],
      actualArrival: new Date("2026-05-28T16:00:00.000Z"),
      estimatedDeparture: new Date("2026-05-28T17:00:00.000Z"),
    });
    const wpRows = getStopTimeDisplayRows(waypoint, "waypoint");
    expect(wpRows).toHaveLength(2);
    expect(wpRows[0]?.label).toBe(routeCopy.label.actualArrival);
    expect(wpRows[1]?.label).toBe(routeCopy.label.estimatedDepartureWaypoint);
  });

  it("derives visit state for progress and badges", () => {
    const tripTimes = { actualDeparture: new Date("2026-05-28T14:00:00.000Z") };
    const origin = stop({
      stopType: [StopType.ORIGIN],
      status: StopStatus.COMPLETED,
      actualDeparture: new Date("2026-05-28T14:00:00.000Z"),
    });
    expect(getStopOperationalVisitState(origin, "origin", tripTimes)).toBe("visited");
    expect(getStopOperationalVisitLabel("visited", "origin")).toBe(
      progressCopy.label.stopCompleted,
    );
    expect(isStopOperativelyComplete(origin, "origin", tripTimes)).toBe(true);

    const escala = stop({
      stopType: [StopType.WAYPOINT],
      status: StopStatus.IN_PROGRESS,
      actualArrival: new Date("2026-05-28T16:00:00.000Z"),
    });
    expect(getStopOperationalVisitState(escala, "waypoint")).toBe("at_stop");
    expect(getStopOperationalVisitLabel("at_stop", "waypoint")).toBe(
      progressCopy.label.stopAtWaypoint,
    );

    const destEnDestino = stop({
      stopType: [StopType.DESTINATION],
      status: StopStatus.IN_PROGRESS,
      actualArrival: new Date("2026-05-28T18:00:00.000Z"),
    });
    expect(getStopOperationalVisitState(destEnDestino, "destination")).toBe("at_stop");
    expect(getStopOperationalVisitLabel("at_stop", "destination")).toBe(
      progressCopy.label.stopAtDestination,
    );

    const destSkipped = stop({
      stopType: [StopType.DESTINATION],
      status: StopStatus.SKIPPED,
    });
    expect(getStopOperationalVisitState(destSkipped, "destination")).toBe(
      "skipped",
    );
    expect(getStopOperationalVisitLabel("skipped", "destination")).toBe(
      progressCopy.label.stopSkippedNotVisited,
    );

    const completed = [
      stop({
        id: "o",
        stopType: [StopType.ORIGIN],
        status: StopStatus.COMPLETED,
      }),
      stop({
        id: "d",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        status: StopStatus.COMPLETED,
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

  it("marks domicilio complete with SAT codes + geo, without RFC", () => {
    expect(
      isStopDomicilioComplete(
        stop({
          satCountryCode: "MEX",
          satEstadoCode: "JAL",
          postalCode: "44100",
          latitude: 20.67,
          longitude: -103.35,
        }),
      ),
    ).toBe(true);
    expect(
      isStopDomicilioComplete(
        stop({
          satCountryCode: "MEX",
          satEstadoCode: "JAL",
          postalCode: "44100",
        }),
      ),
    ).toBe(false);
    expect(
      isStopDomicilioComplete(
        stop({
          rfcRemitenteDestinatario: "XAXX010101000",
          latitude: 20.67,
          longitude: -103.35,
        }),
      ),
    ).toBe(false);
  });

  it("builds origin and destination master rows without trip_stop", () => {
    const rows = buildRouteMasterRows({
      waypoints: [],
      originCityHint: "Guadalajara",
      destinationCityHint: "Monterrey",
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe(ROUTE_SLOT_ORIGIN_ID);
    expect(rows[0]?.cityHint).toBe("Guadalajara");
    expect(rows[1]?.id).toBe(ROUTE_SLOT_DESTINATION_ID);
    expect(rows[1]?.cityHint).toBe("Monterrey");
  });

  it("resolves selection to the first row when the id is missing", () => {
    const rows = buildRouteMasterRows({ waypoints: [] });
    expect(resolveRouteMasterRowId(rows, null)).toBe(ROUTE_SLOT_ORIGIN_ID);
    expect(resolveRouteMasterRowId(rows, "gone")).toBe(ROUTE_SLOT_ORIGIN_ID);
    expect(resolveRouteMasterRowId(rows, ROUTE_SLOT_DESTINATION_ID)).toBe(
      ROUTE_SLOT_DESTINATION_ID,
    );
  });

  it("keeps origin selected after the slot becomes a persisted stop", () => {
    const origin = stop({
      id: "stop-origin",
      stopType: [StopType.ORIGIN, StopType.PICKUP],
    });
    const rows = buildRouteMasterRows({ origin, waypoints: [] });
    expect(resolveRouteMasterRowId(rows, ROUTE_SLOT_ORIGIN_ID)).toBe("stop-origin");
  });
});
