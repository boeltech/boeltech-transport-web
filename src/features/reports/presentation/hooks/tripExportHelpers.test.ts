import { describe, expect, it } from "vitest";
import type { TripListItem } from "@features/trips/domain";
import { TripStatus } from "@features/trips";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import {
  formatTripExportDateTime,
  mapTripListItemToCsvRow,
} from "./tripExportHelpers";
import { getTripExportHeaders } from "../copy/reportsCopy";

const sampleTrip: TripListItem = {
  id: "trip-1",
  tripCode: "VJ-001",
  vehicle: { id: "v1", unitNumber: "U-10", licensePlate: "ABC-123" },
  driver: { id: "d1", fullName: "Juan Pérez" },
  client: { id: "c1", legalName: "Cliente Demo SA" },
  originCity: "Monterrey",
  originState: "NL",
  destinationCity: "Saltillo",
  destinationState: "CO",
  scheduledDeparture: new Date("2026-06-01T15:00:00.000Z"),
  scheduledArrival: new Date("2026-06-01T20:00:00.000Z"),
  status: TripStatus.SCHEDULED,
  operationalOutcome: "standard",
  falseTripDeclaredAt: null,
  falseTripDeclaredBy: null,
  cargoDescription: null,
  totalCost: 1000,
  baseRate: 2500,
  totalRevenue: 2500,
  estimatedProfit: 1500,
  cargoCount: 1,
  clientCount: 1,
  invoicing: tripInvoicingFixture({
    canGenerateInvoice: true,
  }),
  requiresFiscalAttention: false,
  createdAt: new Date("2026-05-31T12:00:00.000Z"),
};

describe("tripExportHelpers", () => {
  it("getTripExportHeaders returns operational columns", () => {
    expect(getTripExportHeaders()).toEqual([
      "codigo_viaje",
      "cliente",
      "origen_ciudad",
      "origen_estado",
      "destino_ciudad",
      "destino_estado",
      "estado",
      "salida_programada",
      "llegada_programada",
      "tarifa_base",
      "vehiculo",
      "conductor",
    ]);
  });

  it("formatTripExportDateTime returns empty for null", () => {
    expect(formatTripExportDateTime(null)).toBe("");
  });

  it("mapTripListItemToCsvRow maps operational fields", () => {
    const row = mapTripListItemToCsvRow(sampleTrip);
    expect(row[0]).toBe("VJ-001");
    expect(row[1]).toBe("Cliente Demo SA");
    expect(row[2]).toBe("Monterrey");
    expect(row[6]).toBe("Programado");
    expect(row[9]).toBe(2500);
    expect(row[10]).toBe("U-10");
    expect(row[11]).toBe("Juan Pérez");
  });
});
