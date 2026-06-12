import { describe, expect, it, vi } from "vitest";
import type { TripListItem } from "@features/trips/domain";
import { TripStatus } from "@features/trips";
import type { IGetTripsUseCase } from "@features/trips/application/useCases/trip/GetTripsUseCase";
import { fetchAllTripsForExport } from "./useExportTrips";

const trip = (id: string): TripListItem =>
  ({
    id,
    tripCode: id,
    vehicle: { id: "v1", unitNumber: "U-10", licensePlate: "ABC" },
    driver: { id: "d1", fullName: "Conductor" },
    client: null,
    originCity: "A",
    originState: "NL",
    destinationCity: "B",
    destinationState: "CO",
    scheduledDeparture: new Date("2026-06-01T15:00:00.000Z"),
    scheduledArrival: null,
    status: TripStatus.SCHEDULED,
    cargoDescription: null,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 0,
    clientCount: 0,
    invoicing: {
      hasActiveInvoice: false,
      canGenerateInvoice: false,
      invoiceId: null,
      invoiceFolio: null,
      invoiceCfdiUuid: null,
      invoiceStatus: null,
      blockReason: null,
    },
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-31T12:00:00.000Z"),
  }) as TripListItem;

describe("fetchAllTripsForExport", () => {
  it("paginates with limit 100 until all pages are fetched", async () => {
    const execute = vi
      .fn<IGetTripsUseCase["execute"]>()
      .mockResolvedValueOnce({
        success: true,
        data: {
          data: [trip("t1"), trip("t2")],
          pagination: { page: 1, limit: 100, total: 150, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          data: [trip("t3")],
          pagination: { page: 2, limit: 100, total: 150, totalPages: 2 },
        },
      });

    const getTripsUseCase = { execute } as IGetTripsUseCase;
    const result = await fetchAllTripsForExport(getTripsUseCase, {});

    expect(result).toHaveLength(3);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0]?.[0]?.limit).toBe(100);
    expect(execute.mock.calls[1]?.[0]?.page).toBe(2);
  });
});
