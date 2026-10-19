import { describe, expect, it } from "vitest";
import {
  mapFleetPositions,
  mapGpsDeviceInfo,
  mapGpsDeviceLinkResult,
} from "./mappers";

describe("monitoring mappers", () => {
  it("maps fleet positions batch with summary", () => {
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
    expect(result.positions[1]?.latitude).toBeNull();
    expect(result.fetchedAt).toBe("2026-10-18T23:45:12Z");
  });

  it("maps linked and unlinked device info", () => {
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
        speed_kmh: 10,
        course_deg: 90,
        recorded_at: "2026-10-18T23:45:00Z",
        stale: true,
        status: "stale",
      },
    });

    expect(linked.linked).toBe(true);
    if (linked.linked) {
      expect(linked.imei).toBe("860012345678901");
      expect(linked.lastPosition?.status).toBe("stale");
      expect(linked.lastPosition?.speedKmh).toBe(10);
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
});
