import { describe, expect, it } from "vitest";
import type { FleetVehiclePosition } from "../../domain";
import { buildFleetPopupHtml } from "./fleetPopupHtml";

const base: FleetVehiclePosition = {
  vehicleId: "veh-1",
  vehicleEconomicNumber: "U-002",
  vehiclePlate: "ABC2002",
  vehicleBrand: "Kenworth",
  vehicleModel: "T680",
  imei: "860012345678901",
  status: "online",
  latitude: 19.4326,
  longitude: -99.1332,
  altitudeM: null,
  speedKmh: 0,
  courseDeg: 45,
  recordedAt: "2026-10-19T15:30:39Z",
  source: "traccar",
  stale: false,
  movementStatus: "stopped",
  satellites: 9,
  batteryPct: 85,
  phone: "5549501176",
  odometerKm: 22356.2,
  address: "Av. Insurgentes Sur 1234",
  addressStatus: "ok",
};

describe("buildFleetPopupHtml", () => {
  it("incluye eco, estado y enlace al vehículo", () => {
    const html = buildFleetPopupHtml(base);
    expect(html).toContain("U-002");
    expect(html).toContain("Kenworth");
    expect(html).toContain("En línea");
    expect(html).toContain("/vehicles/veh-1");
    expect(html).toContain("Ver vehículo");
  });

  it("incluye paridad: abs time, address, cardinal, sats, battery, phone, odometer, movement + historial", () => {
    const html = buildFleetPopupHtml(base);
    expect(html).toContain("Detenido");
    expect(html).toContain("Av. Insurgentes Sur 1234");
    expect(html).toContain("↗ NE 045°");
    expect(html).toContain("#Sats: 9");
    expect(html).toContain("Batería: 85%");
    expect(html).toContain("Tel: 5549501176");
    expect(html).toContain("Odómetro:");
    expect(html).toContain("/monitoring/fleet/history/veh-1");
    expect(html).toContain("Ver historial");
    // Semáforo + movimiento coexisten
    expect(html).toContain("En línea");
  });

  it("muestra dirección no disponible cuando address_status unavailable", () => {
    const html = buildFleetPopupHtml({
      ...base,
      address: null,
      addressStatus: "unavailable",
    });
    expect(html).toContain("Dirección no disponible");
  });

  it("escapa HTML en el eco", () => {
    const html = buildFleetPopupHtml({
      ...base,
      vehicleEconomicNumber: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});
