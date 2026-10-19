import { describe, expect, it } from "vitest";
import {
  mapFleetHistory,
  mapFleetPositions,
  mapGpsAlertSettings,
  mapGpsAlertsList,
  mapGpsAlertsSummary,
  mapGpsDeviceInfo,
  mapGpsDeviceLinkResult,
  mapReverseGeocode,
} from "./mappers";

describe("monitoring mappers", () => {
  it("maps fleet positions batch with parity enrich", () => {
    const result = mapFleetPositions({
      positions: [
        {
          vehicle_id: "v-1",
          vehicle_economic_number: "T-001",
          vehicle_plate: "ABC-123",
          vehicle_brand: "Kenworth",
          vehicle_model: "T680",
          imei: "860012345678901",
          latitude: 19.43,
          longitude: -99.13,
          altitude_m: 2240,
          speed_kmh: 65.3,
          course_deg: 45,
          recorded_at: "2026-10-18T23:45:00Z",
          source: "traccar",
          stale: false,
          status: "online",
          movement_status: "moving",
          satellites: 9,
          battery_pct: 85,
          phone: "5549501176",
          odometer_km: 22356.2,
          address: "Av. Insurgentes 123",
          address_status: "ok",
          unread_alert_count: 2,
        },
        {
          vehicle_id: "v-2",
          vehicle_economic_number: "T-012",
          vehicle_plate: "XYZ-9",
          vehicle_brand: "International",
          vehicle_model: "ProStar",
          imei: "860012345678902",
          latitude: null,
          longitude: null,
          altitude_m: null,
          speed_kmh: null,
          course_deg: null,
          recorded_at: null,
          source: "traccar",
          stale: true,
          status: "offline",
        },
      ],
      summary: {
        total_linked: 2,
        online: 1,
        stale: 0,
        offline: 1,
      },
      fetched_at: "2026-10-18T23:45:12Z",
    });

    expect(result.summary.totalLinked).toBe(2);
    expect(result.positions[0]?.vehicleEconomicNumber).toBe("T-001");
    expect(result.positions[0]?.status).toBe("online");
    expect(result.positions[0]?.movementStatus).toBe("moving");
    expect(result.positions[0]?.satellites).toBe(9);
    expect(result.positions[0]?.batteryPct).toBe(85);
    expect(result.positions[0]?.phone).toBe("5549501176");
    expect(result.positions[0]?.odometerKm).toBe(22356.2);
    expect(result.positions[0]?.address).toBe("Av. Insurgentes 123");
    expect(result.positions[0]?.addressStatus).toBe("ok");
    expect(result.positions[0]?.unreadAlertCount).toBe(2);
    expect(result.positions[1]?.latitude).toBeNull();
    expect(result.positions[1]?.movementStatus).toBeNull();
    expect(result.positions[1]?.addressStatus).toBe("skipped");
    expect(result.fetchedAt).toBe("2026-10-18T23:45:12Z");
  });

  it("maps linked device last_position with parity", () => {
    expect(mapGpsDeviceInfo({ linked: false })).toEqual({ linked: false });

    const linked = mapGpsDeviceInfo({
      linked: true,
      imei: "860012345678901",
      traccar_device_id: "42",
      linked_at: "2026-10-15T14:30:00Z",
      linked_by_name: "Juan García",
      last_position: {
        latitude: 19.43,
        longitude: -99.13,
        speed_kmh: 0,
        course_deg: 90,
        recorded_at: "2026-10-18T23:45:00Z",
        stale: true,
        status: "stale",
        movement_status: "stopped",
        satellites: 7,
        battery_pct: 40,
        phone: null,
        odometer_km: 1000,
        address: null,
        address_status: "unavailable",
      },
    });

    expect(linked.linked).toBe(true);
    if (linked.linked) {
      expect(linked.imei).toBe("860012345678901");
      expect(linked.lastPosition?.status).toBe("stale");
      expect(linked.lastPosition?.movementStatus).toBe("stopped");
      expect(linked.lastPosition?.odometerKm).toBe(1000);
      expect(linked.lastPosition?.addressStatus).toBe("unavailable");
    }
  });

  it("maps link result", () => {
    const result = mapGpsDeviceLinkResult({
      id: "link-1",
      vehicle_id: "v-1",
      imei: "860012345678901",
      traccar_device_id: "42",
      linked_at: "2026-10-18T23:50:00Z",
      linked_by_name: "Admin",
    });
    expect(result.traccarDeviceId).toBe("42");
    expect(result.vehicleId).toBe("v-1");
  });

  it("maps fleet history with sampling flags", () => {
    const history = mapFleetHistory({
      vehicle_id: "v-1",
      imei: "860012345678901",
      from: "2026-10-19T11:00:00Z",
      to: "2026-10-19T15:00:00Z",
      raw_point_count: 4820,
      point_count: 2,
      sampled: true,
      points: [
        {
          seq: 1,
          latitude: 19.43,
          longitude: -99.13,
          speed_kmh: 64.3,
          course_deg: 225,
          recorded_at: "2026-10-19T15:17:16Z",
          movement_status: "moving",
          satellites: 9,
          battery_pct: null,
          odometer_km: 22350.1,
        },
        {
          seq: 2,
          latitude: 19.44,
          longitude: -99.12,
          speed_kmh: 0,
          course_deg: 10,
          recorded_at: "2026-10-19T15:18:16Z",
          movement_status: "stopped",
          satellites: null,
          battery_pct: 80,
          odometer_km: null,
        },
      ],
      fetched_at: "2026-10-19T15:20:00Z",
    });

    expect(history.sampled).toBe(true);
    expect(history.rawPointCount).toBe(4820);
    expect(history.points).toHaveLength(2);
    expect(history.points[0]?.seq).toBe(1);
    expect(history.points[0]?.movementStatus).toBe("moving");
    expect(history.points[1]?.movementStatus).toBe("stopped");
  });

  it("maps reverse geocode degradable response", () => {
    expect(
      mapReverseGeocode({
        latitude: 19.43,
        longitude: -99.13,
        address: null,
        address_status: "unavailable",
        cache_hit: false,
      }),
    ).toEqual({
      latitude: 19.43,
      longitude: -99.13,
      address: null,
      addressStatus: "unavailable",
      cacheHit: false,
    });
  });

  it("maps alert settings including geofence unconfigured", () => {
    const settings = mapGpsAlertSettings({
      geofence_count: 0,
      settings: [
        {
          alert_type: "overspeed",
          enabled: true,
          threshold_value: 100,
          threshold_unit: "kmh",
          configurable: true,
          status: "active",
        },
        {
          alert_type: "geofence_exit",
          enabled: false,
          threshold_value: null,
          threshold_unit: null,
          configurable: true,
          status: "unconfigured",
          unconfigured_reason: "no_geofences",
        },
      ],
    });

    expect(settings.geofenceCount).toBe(0);
    expect(settings.settings[0]?.alertType).toBe("overspeed");
    expect(settings.settings[1]?.status).toBe("unconfigured");
    expect(settings.settings[1]?.unconfiguredReason).toBe("no_geofences");
  });

  it("maps alerts list and summary", () => {
    const list = mapGpsAlertsList(
      [
        {
          id: "a-1",
          alert_type: "long_stop",
          vehicle_id: "v-1",
          vehicle_economic_number: "T-001",
          vehicle_plate: "ABC-123",
          title: "Parada prolongada",
          description: "Detenido 90 min",
          occurred_at: "2026-10-19T15:00:00Z",
          latitude: 19.5,
          longitude: -99.2,
          address: null,
          address_status: "skipped",
          read_at: null,
          payload: { minutes: 90 },
        },
      ],
      { page: 1, page_size: 50, total: 1, total_pages: 1 },
    );

    expect(list.items[0]?.alertType).toBe("long_stop");
    expect(list.items[0]?.vehicleEconomicNumber).toBe("T-001");
    expect(list.pagination.pageSize).toBe(50);

    expect(
      mapGpsAlertsSummary({ unread_count: 4, window_days: 7 }),
    ).toEqual({ unreadCount: 4, windowDays: 7 });
  });
});
